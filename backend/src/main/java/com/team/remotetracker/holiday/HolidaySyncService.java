package com.team.remotetracker.holiday;

import com.team.remotetracker.holiday.entity.Holiday;
import com.team.remotetracker.holiday.entity.HolidaySource;
import jakarta.annotation.PostConstruct;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDate;
import java.time.Year;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/**
 * Pulls Turkish public holidays from Google Calendar's public Turkish holidays iCal feed. The feed
 * includes both national holidays (Yılbaşı, 23 Nisan, etc.) and Diyanet-derived religious days
 * (Ramazan/Kurban Bayramı). No API key required — public ICS download.
 *
 * <p>If the feed is unreachable, falls back to a curated hardcoded list. Manual entries (source =
 * MANUAL) are always preserved by HolidayService.upsertAll.
 */
@Service
public class HolidaySyncService {

  private static final Logger log = LoggerFactory.getLogger(HolidaySyncService.class);
  private static final String GOOGLE_TURKISH_ICS =
      "https://calendar.google.com/calendar/ical/tr.turkish%23holiday%40group.v.calendar.google.com/public/basic.ics";
  private static final Duration TIMEOUT = Duration.ofSeconds(10);

  private final HolidayService holidayService;
  private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(TIMEOUT).build();

  public HolidaySyncService(HolidayService holidayService) {
    this.holidayService = holidayService;
  }

  @PostConstruct
  public void onStartup() {
    int currentYear = Year.now().getValue();
    if (holidayService.hasAutoData(currentYear)) {
      log.info("Holiday data already present for year {}, skipping startup sync", currentYear);
      return;
    }
    log.info("First-time holiday sync for year {}", currentYear);
    syncYearSafe(currentYear);
  }

  /**
   * Year-end sync: 31 December at 03:00 (Europe/Istanbul) — pulls next year's holidays from Google
   * Calendar before the new year starts so the calendar is ready on January 1.
   */
  @Scheduled(cron = "0 0 3 31 12 *", zone = "Europe/Istanbul")
  public void onYearEnd() {
    int nextYear = Year.now().getValue() + 1;
    log.info("Year-end holiday sync starting for year={}", nextYear);
    syncYearSafe(nextYear);
  }

  public int syncYear(int year) {
    var fromGoogle = fetchFromGoogle(year);
    List<Holiday> baseline;
    if (fromGoogle.isEmpty()) {
      log.warn("Google Calendar unavailable for {}, using local fallback", year);
      baseline = mergeByDate(nationalHolidays(year), religiousHolidays(year));
    } else {
      // Even when Google succeeds, merge religious fallback so arefes / multi-day bayrams aren't
      // accidentally missing. Google entries win on date conflicts.
      baseline = mergeByDate(fromGoogle, religiousHolidays(year));
    }
    int written = holidayService.upsertAll(baseline);
    log.info(
        "Holiday sync upserted {} entries for year={} (google={}, total={})",
        written,
        year,
        fromGoogle.size(),
        baseline.size());
    return written;
  }

  private void syncYearSafe(int year) {
    try {
      syncYear(year);
    } catch (Exception ex) {
      log.warn("Holiday sync failed for year={}: {}", year, ex.getMessage());
      var combined = mergeByDate(nationalHolidays(year), religiousHolidays(year));
      if (!combined.isEmpty()) holidayService.upsertAll(combined);
    }
  }

  private static List<Holiday> mergeByDate(List<Holiday> primary, List<Holiday> secondary) {
    var byDate = new HashMap<LocalDate, Holiday>();
    primary.forEach(h -> byDate.put(h.getDate(), h));
    for (var s : secondary) byDate.putIfAbsent(s.getDate(), s);
    return new ArrayList<>(byDate.values());
  }

  // ---------- Google Calendar ICS ----------
  private List<Holiday> fetchFromGoogle(int year) {
    try {
      var request =
          HttpRequest.newBuilder(URI.create(GOOGLE_TURKISH_ICS))
              .timeout(TIMEOUT)
              .header("Accept", "text/calendar")
              .header("User-Agent", "remote-tracker/1.0")
              .GET()
              .build();
      var response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() != 200) {
        log.warn("Google Calendar returned status {} for year {}", response.statusCode(), year);
        return List.of();
      }
      return cleanseGoogle(parseICS(response.body(), year));
    } catch (Exception ex) {
      log.warn("Google Calendar fetch failed for year={}: {}", year, ex.getMessage());
      return List.of();
    }
  }

  // ---------- Google ICS data cleanup ----------
  private static final Pattern RAMADAN_DAY_PATTERN = Pattern.compile("^\\d+ Ramazan$");
  private static final Pattern UNCERTAIN_NOTE = Pattern.compile("\\s*\\(kesin de(ğ|g)il\\)\\s*");
  private static final Pattern HALFDAY_NOTE = Pattern.compile("\\s*\\(yar(ı|i)m g(ü|u)n\\)\\s*");
  private static final Pattern DAY_SUFFIX_EN = Pattern.compile("\\s+Day\\s+(\\d+)");
  private static final Pattern WHITESPACE = Pattern.compile("\\s+");

  /**
   * Filters non-holidays (anma günleri, ay başlangıçları, gece etkinlikleri) and normalizes the
   * inconsistent labelling that Google's Turkish holiday calendar publishes (mixing "Bayrami" with
   * "Bayramı", English "Day N" suffixes, "(kesin değil)" notes, etc.).
   */
  private static List<Holiday> cleanseGoogle(List<Holiday> raw) {
    var seen = new HashSet<LocalDate>();
    var out = new ArrayList<Holiday>();
    for (var h : raw) {
      if (!isPaidHoliday(h.getName())) continue;
      var name = normalizeName(h.getName());
      if (name.isBlank()) continue;
      if (!seen.add(h.getDate())) continue; // first occurrence wins on dedup
      out.add(new Holiday(h.getDate(), name, HolidaySource.AUTO));
    }
    return out;
  }

  private static boolean isPaidHoliday(String rawName) {
    if (rawName == null) return false;
    var lower = rawName.toLowerCase(java.util.Locale.forLanguageTag("tr"));
    if (lower.contains("yılbaşı gecesi") || lower.contains("yilbasi gecesi")) return false;
    if (lower.startsWith("atatürk'ü anma günü") || lower.startsWith("atatürk’ü anma günü")) {
      return false; // 10 Kasım — anma günü, çalışma günü
    }
    if (RAMADAN_DAY_PATTERN.matcher(rawName.trim()).matches())
      return false; // "1 Ramazan" gibi ay başları
    return true;
  }

  private static String normalizeName(String rawName) {
    var s = rawName;
    s = UNCERTAIN_NOTE.matcher(s).replaceAll(" ");
    s = HALFDAY_NOTE.matcher(s).replaceAll(" ");
    s = s.replace("Bayrami", "Bayramı");
    s = s.replace("Arifesi", "Arefe");
    s = s.replace("’", "'");
    s = DAY_SUFFIX_EN.matcher(s).replaceAll(" $1. Gün");
    s = WHITESPACE.matcher(s).replaceAll(" ").trim();
    return s;
  }

  private static List<Holiday> parseICS(String body, int year) {
    var unfolded =
        body.replace("\r\n ", "").replace("\r\n\t", "").replace("\n ", "").replace("\n\t", "");
    var holidays = new ArrayList<Holiday>();
    String summary = null;
    LocalDate start = null;
    LocalDate end = null;
    boolean inEvent = false;
    for (var rawLine : unfolded.split("\\r?\\n")) {
      var line = rawLine.trim();
      if (line.isEmpty()) continue;
      if (line.equals("BEGIN:VEVENT")) {
        inEvent = true;
        summary = null;
        start = null;
        end = null;
      } else if (line.equals("END:VEVENT")) {
        if (summary != null && start != null) {
          var endExclusive = end != null ? end : start.plusDays(1);
          for (var d = start; d.isBefore(endExclusive); d = d.plusDays(1)) {
            if (d.getYear() == year) {
              holidays.add(new Holiday(d, summary, HolidaySource.AUTO));
            }
          }
        }
        inEvent = false;
      } else if (inEvent) {
        if (line.startsWith("SUMMARY")) {
          summary = unescapeICS(extractValue(line));
        } else if (line.startsWith("DTSTART")) {
          start = parseDate(extractValue(line));
        } else if (line.startsWith("DTEND")) {
          end = parseDate(extractValue(line));
        }
      }
    }
    return holidays;
  }

  private static String extractValue(String line) {
    int colon = line.indexOf(':');
    if (colon < 0) return "";
    return line.substring(colon + 1).trim();
  }

  private static LocalDate parseDate(String value) {
    if (value == null || value.length() < 8) return null;
    try {
      int year = Integer.parseInt(value.substring(0, 4));
      int month = Integer.parseInt(value.substring(4, 6));
      int day = Integer.parseInt(value.substring(6, 8));
      return LocalDate.of(year, month, day);
    } catch (Exception ex) {
      return null;
    }
  }

  private static String unescapeICS(String value) {
    return value
        .replace("\\,", ",")
        .replace("\\;", ";")
        .replace("\\\\", "\\")
        .replace("\\n", " ")
        .replace("\\N", " ");
  }

  // ---------- Hardcoded fallbacks (used when Google is unreachable) ----------
  private static List<Holiday> religiousHolidays(int year) {
    return switch (year) {
      case 2024 ->
          List.of(
              hol(2024, 4, 9, "Ramazan Bayramı (Arefe)"),
              hol(2024, 4, 10, "Ramazan Bayramı 1. Gün"),
              hol(2024, 4, 11, "Ramazan Bayramı 2. Gün"),
              hol(2024, 4, 12, "Ramazan Bayramı 3. Gün"),
              hol(2024, 6, 15, "Kurban Bayramı (Arefe)"),
              hol(2024, 6, 16, "Kurban Bayramı 1. Gün"),
              hol(2024, 6, 17, "Kurban Bayramı 2. Gün"),
              hol(2024, 6, 18, "Kurban Bayramı 3. Gün"),
              hol(2024, 6, 19, "Kurban Bayramı 4. Gün"));
      case 2025 ->
          List.of(
              hol(2025, 3, 29, "Ramazan Bayramı (Arefe)"),
              hol(2025, 3, 30, "Ramazan Bayramı 1. Gün"),
              hol(2025, 3, 31, "Ramazan Bayramı 2. Gün"),
              hol(2025, 4, 1, "Ramazan Bayramı 3. Gün"),
              hol(2025, 6, 5, "Kurban Bayramı (Arefe)"),
              hol(2025, 6, 6, "Kurban Bayramı 1. Gün"),
              hol(2025, 6, 7, "Kurban Bayramı 2. Gün"),
              hol(2025, 6, 8, "Kurban Bayramı 3. Gün"),
              hol(2025, 6, 9, "Kurban Bayramı 4. Gün"));
      case 2026 ->
          List.of(
              hol(2026, 3, 20, "Ramazan Bayramı (Arefe)"),
              hol(2026, 3, 21, "Ramazan Bayramı 1. Gün"),
              hol(2026, 3, 22, "Ramazan Bayramı 2. Gün"),
              hol(2026, 3, 23, "Ramazan Bayramı 3. Gün"),
              hol(2026, 5, 26, "Kurban Bayramı (Arefe)"),
              hol(2026, 5, 27, "Kurban Bayramı 1. Gün"),
              hol(2026, 5, 28, "Kurban Bayramı 2. Gün"),
              hol(2026, 5, 29, "Kurban Bayramı 3. Gün"),
              hol(2026, 5, 30, "Kurban Bayramı 4. Gün"));
      case 2027 ->
          List.of(
              hol(2027, 3, 9, "Ramazan Bayramı (Arefe)"),
              hol(2027, 3, 10, "Ramazan Bayramı 1. Gün"),
              hol(2027, 3, 11, "Ramazan Bayramı 2. Gün"),
              hol(2027, 3, 12, "Ramazan Bayramı 3. Gün"),
              hol(2027, 5, 16, "Kurban Bayramı (Arefe)"),
              hol(2027, 5, 17, "Kurban Bayramı 1. Gün"),
              hol(2027, 5, 18, "Kurban Bayramı 2. Gün"),
              hol(2027, 5, 19, "Kurban Bayramı 3. Gün"),
              hol(2027, 5, 20, "Kurban Bayramı 4. Gün"));
      case 2028 ->
          List.of(
              hol(2028, 2, 25, "Ramazan Bayramı (Arefe)"),
              hol(2028, 2, 26, "Ramazan Bayramı 1. Gün"),
              hol(2028, 2, 27, "Ramazan Bayramı 2. Gün"),
              hol(2028, 2, 28, "Ramazan Bayramı 3. Gün"),
              hol(2028, 5, 4, "Kurban Bayramı (Arefe)"),
              hol(2028, 5, 5, "Kurban Bayramı 1. Gün"),
              hol(2028, 5, 6, "Kurban Bayramı 2. Gün"),
              hol(2028, 5, 7, "Kurban Bayramı 3. Gün"),
              hol(2028, 5, 8, "Kurban Bayramı 4. Gün"));
      default -> List.of();
    };
  }

  private static List<Holiday> nationalHolidays(int year) {
    return List.of(
        hol(year, 1, 1, "Yılbaşı"),
        hol(year, 4, 23, "Ulusal Egemenlik ve Çocuk Bayramı"),
        hol(year, 5, 1, "Emek ve Dayanışma Günü"),
        hol(year, 5, 19, "Atatürk'ü Anma, Gençlik ve Spor Bayramı"),
        hol(year, 7, 15, "Demokrasi ve Milli Birlik Günü"),
        hol(year, 8, 30, "Zafer Bayramı"),
        hol(year, 10, 29, "Cumhuriyet Bayramı"));
  }

  private static Holiday hol(int year, int month, int day, String name) {
    return new Holiday(LocalDate.of(year, month, day), name, HolidaySource.AUTO);
  }
}
