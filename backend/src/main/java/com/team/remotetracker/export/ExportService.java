package com.team.remotetracker.export;

import com.lowagie.text.Chunk;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPCellEvent;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.team.remotetracker.holiday.HolidayService;
import com.team.remotetracker.schedule.ScheduleRepository;
import com.team.remotetracker.schedule.ScheduleService;
import com.team.remotetracker.schedule.analytics.AnalyticsService;
import com.team.remotetracker.schedule.analytics.dto.MonthAnalyticsResponse;
import com.team.remotetracker.schedule.analytics.dto.UserAnalyticsRow;
import com.team.remotetracker.schedule.dto.DayStatusResponse;
import com.team.remotetracker.schedule.entity.DayCode;
import com.team.remotetracker.schedule.entity.DayStatus;
import com.team.remotetracker.schedule.entity.LeadStatus;
import com.team.remotetracker.schedule.entity.WeeklySchedule;
import com.team.remotetracker.schedule.lead.LeadScheduleService;
import com.team.remotetracker.schedule.lead.dto.LeadDayResponse;
import com.team.remotetracker.user.UserRepository;
import com.team.remotetracker.user.UserService;
import com.team.remotetracker.user.entity.Department;
import com.team.remotetracker.user.entity.Role;
import com.team.remotetracker.user.entity.TeamGroup;
import com.team.remotetracker.user.entity.User;
import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ExportService {

  private static final String TR_ENCODING = "Cp1254"; // Windows-1254 / Turkish — ı, ğ, ş, etc.
  private static final String[] TR_DOW = {"Pzt", "Sal", "Çar", "Per", "Cum"};
  private static final String[] TR_MONTHS = {
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  };
  private static final String[] TR_DOW_LONG_INDEX = {
    "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"
  };

  private static final Color INK = new Color(11, 11, 16);
  private static final Color HEADER_BG = new Color(79, 70, 229);
  private static final Color REMOTE_BG = new Color(200, 237, 216);
  private static final Color OFFICE_BG = new Color(191, 219, 254);
  private static final Color DEPLOY_BG = new Color(254, 215, 170);
  private static final Color HOLIDAY_BG = new Color(180, 73, 78);
  private static final Color HALF_HOLIDAY_BG = new Color(132, 73, 180);
  private static final Color BORDER = new Color(226, 232, 240);
  private static final Color MUTED_INK = new Color(120, 120, 120);

  private static final BaseFont DAY_NUMBER_FONT = createDayNumberFont();

  private static BaseFont createDayNumberFont() {
    try {
      return BaseFont.createFont(BaseFont.HELVETICA_BOLD, TR_ENCODING, BaseFont.NOT_EMBEDDED);
    } catch (Exception e) {
      throw new IllegalStateException(e);
    }
  }

  private final ScheduleRepository scheduleRepository;
  private final UserRepository userRepository;
  private final UserService userService;
  private final HolidayService holidayService;
  private final LeadScheduleService leadScheduleService;
  private final ScheduleService scheduleService;
  private final AnalyticsService analyticsService;

  public ExportService(
      ScheduleRepository scheduleRepository,
      UserRepository userRepository,
      UserService userService,
      HolidayService holidayService,
      LeadScheduleService leadScheduleService,
      ScheduleService scheduleService,
      AnalyticsService analyticsService) {
    this.scheduleRepository = scheduleRepository;
    this.userRepository = userRepository;
    this.userService = userService;
    this.holidayService = holidayService;
    this.leadScheduleService = leadScheduleService;
    this.scheduleService = scheduleService;
    this.analyticsService = analyticsService;
  }

  // ---------- Schedule (departman) PDF ----------
  public byte[] exportMonthPdf(int year, int month, Department department) throws IOException {
    var bounds = monthBounds(year, month);
    var rows = loadRows(department, bounds[0], bounds[1]);
    var holidays = holidayService.getHolidayMap(year);
    var halfDays = holidayService.getHalfDayHolidays(year);

    try (var out = new ByteArrayOutputStream()) {
      var doc = new Document(PageSize.A4.rotate(), 36, 36, 36, 36);
      PdfWriter.getInstance(doc, out);
      doc.open();

      doc.add(
          titleHeading(
              "Remote Çalışma Takvimi · "
                  + label(department)
                  + " · "
                  + TR_MONTHS[month - 1]
                  + " "
                  + year));

      var grid = new PdfPTable(6);
      grid.setWidthPercentage(100);
      grid.setWidths(new float[] {2.4f, 1f, 1f, 1f, 1f, 1f});
      grid.setSpacingAfter(8f);
      addHeaderCell(grid, "Hafta");
      for (var dow : TR_DOW) addHeaderCell(grid, dow);
      for (var s : rows) {
        addCell(grid, formatRange(s.getWeekStartDate()), false, null);
        addCodeCell(grid, s.getMonday(), s.getWeekStartDate(), holidays, halfDays);
        addCodeCell(grid, s.getTuesday(), s.getWeekStartDate().plusDays(1), holidays, halfDays);
        addCodeCell(grid, s.getWednesday(), s.getWeekStartDate().plusDays(2), holidays, halfDays);
        addCodeCell(grid, s.getThursday(), s.getWeekStartDate().plusDays(3), holidays, halfDays);
        addCodeCell(grid, s.getFriday(), s.getWeekStartDate().plusDays(4), holidays, halfDays);
      }
      doc.add(grid);

      addLegend(doc);
      addRosters(doc, department, bounds[1]);

      doc.close();
      return out.toByteArray();
    }
  }

  // ---------- Lead PDF ----------
  public byte[] exportLeadsPdf(int year, int month, Department department) throws IOException {
    var leadDays = leadScheduleService.findMonth(year, month, department);
    var holidays = holidayService.getHolidayMap(year);
    var halfDays = holidayService.getHalfDayHolidays(year);
    var bounds = monthBounds(year, month);
    var weeks = computeWeeks(bounds[0], bounds[1]);
    var leadOrder = collectLeads(leadDays);
    var lookup = indexLeadDays(leadDays);

    try (var out = new ByteArrayOutputStream()) {
      var doc = new Document(PageSize.A4.rotate(), 36, 36, 36, 36);
      PdfWriter.getInstance(doc, out);
      doc.open();

      doc.add(
          titleHeading(
              "Lead Çalışma Takvimi · "
                  + label(department)
                  + " · "
                  + TR_MONTHS[month - 1]
                  + " "
                  + year));

      if (leadOrder.isEmpty()) {
        doc.add(new Paragraph("Bu departmanda takım lideri bulunmuyor.", font(11, MUTED_INK)));
        doc.close();
        return out.toByteArray();
      }

      var grid = new PdfPTable(7);
      grid.setWidthPercentage(100);
      grid.setWidths(new float[] {1.6f, 2.2f, 1f, 1f, 1f, 1f, 1f});
      grid.setSpacingAfter(8f);
      addHeaderCell(grid, "Hafta");
      addHeaderCell(grid, "Takım Lideri");
      for (var dow : TR_DOW) addHeaderCell(grid, dow);

      for (var monday : weeks) {
        for (var entry : leadOrder.entrySet()) {
          addCell(grid, formatRange(monday), false, null);
          addCell(grid, entry.getValue(), false, null);
          for (int offset = 0; offset < 5; offset++) {
            var date = monday.plusDays(offset);
            addLeadDayCell(grid, lookup, entry.getKey(), date, holidays, halfDays);
          }
        }
      }
      doc.add(grid);

      addLeadLegend(doc);
      addLeadSummary(doc, leadDays, leadOrder, year, month);

      doc.close();
      return out.toByteArray();
    }
  }

  // ---------- Helpers ----------
  private List<WeeklySchedule> loadRows(Department department, LocalDate from, LocalDate to) {
    return department == null
        ? scheduleRepository.findAllByWeekStartDateBetweenOrderByWeekStartDateAsc(from, to)
        : scheduleRepository.findAllByDepartmentAndWeekStartDateBetweenOrderByWeekStartDateAsc(
            department, from, to);
  }

  private static LocalDate[] monthBounds(int year, int month) {
    var ym = YearMonth.of(year, month);
    var first = ym.atDay(1);
    var firstMon = first.minusDays(((first.getDayOfWeek().getValue() + 6) % 7));
    return new LocalDate[] {firstMon, ym.atEndOfMonth()};
  }

  private static List<LocalDate> computeWeeks(LocalDate firstMonday, LocalDate end) {
    var out = new java.util.ArrayList<LocalDate>();
    var cursor = firstMonday;
    while (!cursor.isAfter(end)) {
      out.add(cursor);
      cursor = cursor.plusWeeks(1);
    }
    return out;
  }

  private static String label(Department dept) {
    if (dept == null) return "Tüm Departmanlar";
    return dept == Department.DEV ? "Geliştirici/Analiz" : "Test/Raporlama";
  }

  private static String formatRange(LocalDate monday) {
    var fri = monday.plusDays(4);
    if (monday.getMonth() == fri.getMonth()) {
      return monday.getDayOfMonth()
          + " – "
          + fri.getDayOfMonth()
          + " "
          + TR_MONTHS[fri.getMonthValue() - 1];
    }
    return monday.getDayOfMonth()
        + " "
        + TR_MONTHS[monday.getMonthValue() - 1].substring(0, 3)
        + " – "
        + fri.getDayOfMonth()
        + " "
        + TR_MONTHS[fri.getMonthValue() - 1].substring(0, 3);
  }

  private static String codeText(DayCode code) {
    return switch (code) {
      case A -> "A";
      case B -> "B";
      case OFFICE -> "TÜM";
      case NONE -> "—";
    };
  }

  private static Color colorFor(DayCode code) {
    return switch (code) {
      case A -> REMOTE_BG;
      case B -> OFFICE_BG;
      case OFFICE -> DEPLOY_BG;
      case NONE -> Color.WHITE;
    };
  }

  private static Font font(float size, Color color) {
    return FontFactory.getFont(FontFactory.HELVETICA, TR_ENCODING, false, size, Font.NORMAL, color);
  }

  private static Font fontBold(float size, Color color) {
    return FontFactory.getFont(FontFactory.HELVETICA, TR_ENCODING, false, size, Font.BOLD, color);
  }

  private static Paragraph blank() {
    var p = new Paragraph(new Chunk(" "));
    p.setSpacingAfter(6f);
    return p;
  }

  private static Paragraph sectionHeading(String text) {
    var p = new Paragraph(text, fontBold(12, INK));
    p.setSpacingBefore(18f);
    p.setSpacingAfter(10f);
    return p;
  }

  private static Paragraph titleHeading(String text) {
    var p = new Paragraph(text, fontBold(18, INK));
    p.setSpacingAfter(16f);
    return p;
  }

  private static void addHeaderCell(PdfPTable table, String label) {
    var cell = new PdfPCell(new Phrase(label, fontBold(11, Color.WHITE)));
    cell.setBackgroundColor(HEADER_BG);
    cell.setHorizontalAlignment(Element.ALIGN_CENTER);
    cell.setPadding(8f);
    cell.setBorder(Rectangle.NO_BORDER);
    table.addCell(cell);
  }

  private static void addCell(PdfPTable table, String value, boolean center, Color bg) {
    var cell = new PdfPCell(new Phrase(value, font(10, textColorOn(bg))));
    if (center) cell.setHorizontalAlignment(Element.ALIGN_CENTER);
    if (bg != null) cell.setBackgroundColor(bg);
    cell.setPadding(6f);
    cell.setBorderColor(BORDER);
    table.addCell(cell);
  }

  private static Color textColorOn(Color bg) {
    if (bg == HOLIDAY_BG || bg == HALF_HOLIDAY_BG) return Color.WHITE;
    return INK;
  }

  private static Color mutedTextColorOn(Color bg) {
    if (bg == HOLIDAY_BG || bg == HALF_HOLIDAY_BG) return Color.WHITE;
    return MUTED_INK;
  }

  private static void addDayCell(PdfPTable table, String label, int dayOfMonth, Color bg) {
    var cell = new PdfPCell(new Phrase(label, font(10, textColorOn(bg))));
    cell.setHorizontalAlignment(Element.ALIGN_CENTER);
    cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
    cell.setPadding(6f);
    cell.setMinimumHeight(30f);
    if (bg != null) cell.setBackgroundColor(bg);
    cell.setBorderColor(BORDER);
    cell.setCellEvent(dayCornerEvent(dayOfMonth, mutedTextColorOn(bg)));
    table.addCell(cell);
  }

  private static PdfPCellEvent dayCornerEvent(int dayOfMonth, Color color) {
    final String text = String.valueOf(dayOfMonth);
    return (c, position, canvases) -> {
      var canvas = canvases[PdfPTable.TEXTCANVAS];
      canvas.saveState();
      canvas.beginText();
      canvas.setFontAndSize(DAY_NUMBER_FONT, 7f);
      canvas.setColorFill(color);
      canvas.setTextMatrix(position.getLeft() + 4f, position.getTop() - 9f);
      canvas.showText(text);
      canvas.endText();
      canvas.restoreState();
    };
  }

  private static void addCodeCell(
      PdfPTable table,
      DayCode code,
      LocalDate date,
      Map<LocalDate, String> holidays,
      Set<LocalDate> halfDays) {
    boolean isHoliday = holidays.containsKey(date);
    boolean isHalfDay = isHoliday && halfDays.contains(date);
    Color bg;
    if (isHalfDay) bg = HALF_HOLIDAY_BG;
    else if (isHoliday) bg = HOLIDAY_BG;
    else bg = colorFor(code);
    String label;
    if (isHoliday) label = isHalfDay ? "Yarım Gün" : "TATİL";
    else label = codeText(code);
    addDayCell(table, label, date.getDayOfMonth(), bg);
  }

  private static void addLegend(Document doc) {
    doc.add(sectionHeading("Renk açıklaması"));
    var legend = new PdfPTable(5);
    legend.setWidthPercentage(85);
    legend.setHorizontalAlignment(Element.ALIGN_LEFT);
    legend.setSpacingAfter(6f);
    legendCell(legend, REMOTE_BG, "A Grubu Remote");
    legendCell(legend, OFFICE_BG, "B Grubu Remote");
    legendCell(legend, DEPLOY_BG, "Tüm Ekip Ofiste");
    legendCell(legend, HOLIDAY_BG, "Resmi Tatil");
    legendCell(legend, HALF_HOLIDAY_BG, "Yarım Gün");
    doc.add(legend);
  }

  private static void legendCell(PdfPTable table, Color bg, String label) {
    var cell = new PdfPCell(new Phrase(label, font(10, textColorOn(bg))));
    cell.setBackgroundColor(bg);
    cell.setHorizontalAlignment(Element.ALIGN_CENTER);
    cell.setPadding(6f);
    cell.setBorderColor(BORDER);
    table.addCell(cell);
  }

  private static void addLeadLegend(Document doc) {
    doc.add(sectionHeading("Renk açıklaması"));
    var legend = new PdfPTable(4);
    legend.setWidthPercentage(70);
    legend.setHorizontalAlignment(Element.ALIGN_LEFT);
    legend.setSpacingAfter(6f);
    legendCell(legend, REMOTE_BG, "Remote");
    legendCell(legend, OFFICE_BG, "Ofiste");
    legendCell(legend, HOLIDAY_BG, "Resmi Tatil");
    legendCell(legend, HALF_HOLIDAY_BG, "Yarım Gün");
    doc.add(legend);
  }

  private void addRosters(Document doc, Department department, LocalDate asOf) {
    var users =
        userRepository.findAllByActiveTrue().stream()
            .filter(u -> u.getRole() == Role.DEV || u.getRole() == Role.TEST)
            .filter(u -> department == null || u.getDepartment() == department)
            .sorted(Comparator.comparing(User::getFullName))
            .toList();
    var groupsAtDate = userService.teamGroupsAt(users, asOf);

    var groupA = users.stream().filter(u -> groupsAtDate.get(u.getId()) == TeamGroup.A).toList();
    var groupB = users.stream().filter(u -> groupsAtDate.get(u.getId()) == TeamGroup.B).toList();

    doc.add(sectionHeading("Grup üyeleri"));

    var rosterTable = new PdfPTable(2);
    rosterTable.setWidthPercentage(100);
    rosterTable.setWidths(new float[] {1f, 1f});
    rosterTable.setSpacingAfter(6f);
    rosterTable.addCell(rosterCell("A Grubu (" + groupA.size() + ")", groupA, REMOTE_BG));
    rosterTable.addCell(rosterCell("B Grubu (" + groupB.size() + ")", groupB, OFFICE_BG));
    doc.add(rosterTable);
  }

  private static PdfPCell rosterCell(String title, List<User> users, Color tint) {
    var inner = new PdfPTable(1);
    inner.setWidthPercentage(100);

    var header = new PdfPCell(new Phrase(title, fontBold(11, INK)));
    header.setBackgroundColor(tint);
    header.setPadding(6f);
    header.setBorder(Rectangle.NO_BORDER);
    inner.addCell(header);

    if (users.isEmpty()) {
      var empty = new PdfPCell(new Phrase("—", font(10, MUTED_INK)));
      empty.setPadding(6f);
      empty.setBorder(Rectangle.NO_BORDER);
      inner.addCell(empty);
    } else {
      for (var u : users) {
        var line = new Phrase(u.getFullName() + "  ", font(10, INK));
        line.add(new Chunk("@" + u.getUsername(), font(9, MUTED_INK)));
        var cell = new PdfPCell(line);
        cell.setPadding(5f);
        cell.setBorder(Rectangle.NO_BORDER);
        inner.addCell(cell);
      }
    }

    var wrapper = new PdfPCell(inner);
    wrapper.setPadding(4f);
    wrapper.setBorderColor(BORDER);
    return wrapper;
  }

  private static LinkedHashMap<java.util.UUID, String> collectLeads(List<LeadDayResponse> days) {
    var leads = new TreeMap<String, java.util.UUID>(); // sorted by name
    for (var d : days) leads.putIfAbsent(d.lead().fullName(), d.lead().id());
    var ordered = new LinkedHashMap<java.util.UUID, String>();
    leads.forEach((name, id) -> ordered.put(id, name));
    return ordered;
  }

  private static Map<String, LeadStatus> indexLeadDays(List<LeadDayResponse> days) {
    var map = new HashMap<String, LeadStatus>();
    for (var d : days) map.put(d.lead().id() + "|" + d.date(), d.status());
    return map;
  }

  private static void addLeadDayCell(
      PdfPTable table,
      Map<String, LeadStatus> lookup,
      java.util.UUID leadId,
      LocalDate date,
      Map<LocalDate, String> holidays,
      Set<LocalDate> halfDays) {
    int dom = date.getDayOfMonth();
    if (holidays.containsKey(date)) {
      boolean isHalf = halfDays.contains(date);
      addDayCell(
          table, isHalf ? "Yarım Gün" : "TATİL", dom, isHalf ? HALF_HOLIDAY_BG : HOLIDAY_BG);
      return;
    }
    var status = lookup.get(leadId + "|" + date);
    if (status == null) {
      addDayCell(table, "—", dom, Color.WHITE);
      return;
    }
    if (status == LeadStatus.REMOTE) {
      addDayCell(table, "Remote", dom, REMOTE_BG);
      return;
    }
    addDayCell(table, "Ofiste", dom, OFFICE_BG);
  }

  private static void addLeadSummary(
      Document doc,
      List<LeadDayResponse> days,
      LinkedHashMap<java.util.UUID, String> leadOrder,
      int year,
      int month) {
    doc.add(sectionHeading("Aylık özet"));

    var counts = new HashMap<java.util.UUID, int[]>(); // [remote, office]
    for (var d : days) {
      var date = d.date();
      if (date.getYear() != year || date.getMonthValue() != month) continue;
      if (date.getDayOfWeek() == DayOfWeek.SATURDAY || date.getDayOfWeek() == DayOfWeek.SUNDAY)
        continue;
      var slot = counts.computeIfAbsent(d.lead().id(), k -> new int[2]);
      if (d.status() == LeadStatus.REMOTE) slot[0]++;
      else slot[1]++;
    }

    var summary = new PdfPTable(3);
    summary.setWidthPercentage(70);
    summary.setHorizontalAlignment(Element.ALIGN_LEFT);
    summary.setWidths(new float[] {2.6f, 1f, 1f});
    summary.setSpacingAfter(6f);
    addHeaderCell(summary, "Takım Lideri");
    addHeaderCell(summary, "Remote");
    addHeaderCell(summary, "Ofiste");
    for (var entry : leadOrder.entrySet()) {
      var slot = counts.getOrDefault(entry.getKey(), new int[2]);
      addCell(summary, entry.getValue(), false, null);
      addCell(summary, String.valueOf(slot[0]), true, REMOTE_BG);
      addCell(summary, String.valueOf(slot[1]), true, OFFICE_BG);
    }
    doc.add(summary);
  }

  public String filenameFor(int year, int month, Department department, String ext) {
    String dept = department == null ? "tum" : department.name().toLowerCase(Locale.ROOT);
    return String.format("takvim-%s-%04d-%02d.%s", dept, year, month, ext);
  }

  public String leadsFilenameFor(int year, int month, Department department) {
    String dept = department == null ? "tum" : department.name().toLowerCase(Locale.ROOT);
    return String.format("lead-takvim-%s-%04d-%02d.pdf", dept, year, month);
  }

  // ---------- Kullanıcı kişisel PDF ----------
  public byte[] exportMyMonthPdf(java.util.UUID userId, int year, int month) throws IOException {
    User user = userService.getEntityById(userId);
    List<DayStatusResponse> myDays = scheduleService.findMyMonth(userId, year, month);
    var groupsAtDate =
        userService.teamGroupsAt(List.of(user), YearMonth.of(year, month).atEndOfMonth());
    TeamGroup userGroup = groupsAtDate.get(user.getId());

    try (var out = new ByteArrayOutputStream()) {
      var doc = new Document(PageSize.A4, 36, 36, 36, 36);
      PdfWriter.getInstance(doc, out);
      doc.open();

      doc.add(titleHeading("Remote Çalışma Takvimi · " + TR_MONTHS[month - 1] + " " + year));

      var subtitle = new StringBuilder(user.getFullName());
      subtitle.append(" · ").append(user.getRole().turkishLabel());
      Department dept = user.getDepartment();
      if (dept != null
          && (user.getRole() == Role.DEV || user.getRole() == Role.TEST)
          && userGroup != null) {
        subtitle.append(" · ").append(userGroup.name()).append(" Grubu");
      }
      var subPara = new Paragraph(subtitle.toString(), font(12, MUTED_INK));
      subPara.setSpacingAfter(14f);
      doc.add(subPara);

      var table = new PdfPTable(3);
      table.setWidthPercentage(100);
      table.setWidths(new float[] {1.4f, 1.2f, 3.2f});
      table.setSpacingAfter(8f);
      addHeaderCell(table, "Tarih");
      addHeaderCell(table, "Gün");
      addHeaderCell(table, "Durum");

      var halfDays = holidayService.getHalfDayHolidays(year);
      int remote = 0, office = 0, deploy = 0, holiday = 0, none = 0;
      for (var d : myDays) {
        if (d.status() == DayStatus.WEEKEND) continue;
        if (d.date().getMonthValue() != month) continue;
        addCell(table, formatDay(d.date()), false, null);
        addCell(table, TR_DOW_LONG_INDEX[d.date().getDayOfWeek().getValue() - 1], false, null);
        addCell(
            table,
            dayStatusLabel(d.status(), d.holidayName(), halfDays.contains(d.date())),
            false,
            bgFor(d.status(), halfDays.contains(d.date())));
        switch (d.status()) {
          case REMOTE -> remote++;
          case OFFICE -> office++;
          case EVERYONE_OFFICE -> deploy++;
          case HOLIDAY -> holiday++;
          case NONE -> none++;
          case WEEKEND -> {}
        }
      }
      doc.add(table);

      doc.add(sectionHeading("Aylık özet"));
      var summary = new PdfPTable(2);
      summary.setWidthPercentage(60);
      summary.setHorizontalAlignment(Element.ALIGN_LEFT);
      summary.setWidths(new float[] {2.5f, 1f});
      summary.setSpacingAfter(6f);
      addSummaryRow(summary, "Remote", remote);
      addSummaryRow(summary, "Ofiste", office);
      addSummaryRow(summary, "Tüm ekip ofiste", deploy);
      addSummaryRow(summary, "Resmi tatil", holiday);
      addSummaryRow(summary, "Plansız", none);
      doc.add(summary);

      var footer =
          new Paragraph(formatDay(LocalDate.now()) + " tarihinde oluşturuldu", font(9, MUTED_INK));
      footer.setSpacingBefore(10f);
      doc.add(footer);

      doc.close();
      return out.toByteArray();
    }
  }

  public String myMonthFilenameFor(java.util.UUID userId, int year, int month) {
    User user = userService.getEntityById(userId);
    return String.format(
        "takvimim-%s-%04d-%02d.pdf", user.getUsername().toLowerCase(Locale.ROOT), year, month);
  }

  // ---------- Dashboard PDF ----------
  public byte[] exportDashboardPdf(
      java.util.UUID actorId, int year, int month, Department requested) throws IOException {
    MonthAnalyticsResponse data = analyticsService.monthAnalytics(actorId, year, month, requested);

    try (var out = new ByteArrayOutputStream()) {
      var doc = new Document(PageSize.A4.rotate(), 36, 36, 36, 36);
      PdfWriter.getInstance(doc, out);
      doc.open();

      doc.add(
          titleHeading(
              "Dashboard · "
                  + label(data.department())
                  + " · "
                  + TR_MONTHS[data.month() - 1]
                  + " "
                  + data.year()));

      // Üst özet kartları (kişi başı ortalama)
      int peopleCount = data.rows().size();
      int avgRemote = peopleCount == 0 ? 0 : data.summary().remoteSum() / peopleCount;
      int avgOffice = peopleCount == 0 ? 0 : data.summary().officeSum() / peopleCount;
      int avgEveryone = peopleCount == 0 ? 0 : data.summary().everyoneOfficeSum() / peopleCount;
      int avgNone = peopleCount == 0 ? 0 : data.summary().noneSum() / peopleCount;

      var summaryTable = new PdfPTable(4);
      summaryTable.setWidthPercentage(100);
      summaryTable.setWidths(new float[] {1f, 1f, 1f, 1f});
      summaryTable.setSpacingAfter(12f);
      addSummaryCard(summaryTable, "Ort. Remote", avgRemote + " gün / kişi", REMOTE_BG);
      addSummaryCard(summaryTable, "Ort. Ofiste", avgOffice + " gün / kişi", OFFICE_BG);
      addSummaryCard(summaryTable, "Tüm ekip ofiste", avgEveryone + " gün", DEPLOY_BG);
      addSummaryCard(summaryTable, "Ort. Plansız", avgNone + " gün / kişi", Color.WHITE);
      doc.add(summaryTable);

      // Grup karşılaştırması
      doc.add(sectionHeading("Grup karşılaştırması (kişi başı ortalama)"));
      var groupTable = new PdfPTable(4);
      groupTable.setWidthPercentage(100);
      groupTable.setWidths(new float[] {1f, 1f, 1.4f, 1f});
      groupTable.setSpacingAfter(12f);
      addHeaderCell(groupTable, "Grup");
      addHeaderCell(groupTable, "Üye");
      addHeaderCell(groupTable, "Ort. Remote / Ofiste");
      addHeaderCell(groupTable, "Remote %");
      addGroupRow(groupTable, "A Grubu", REMOTE_BG, data.summary().groupA());
      addGroupRow(groupTable, "B Grubu", OFFICE_BG, data.summary().groupB());
      doc.add(groupTable);

      // Ana tablo
      doc.add(sectionHeading("Kullanıcı kırılımı"));
      var rowsTable = new PdfPTable(9);
      rowsTable.setWidthPercentage(100);
      rowsTable.setWidths(new float[] {2.4f, 0.8f, 1f, 1f, 1.4f, 1f, 1f, 1f, 1f});
      addHeaderCell(rowsTable, "İsim");
      addHeaderCell(rowsTable, "Grup");
      addHeaderCell(rowsTable, "Remote");
      addHeaderCell(rowsTable, "Ofiste");
      addHeaderCell(rowsTable, "Tüm ekip");
      addHeaderCell(rowsTable, "Tatil");
      addHeaderCell(rowsTable, "Plansız");
      addHeaderCell(rowsTable, "Toplam");
      addHeaderCell(rowsTable, "Remote %");
      for (UserAnalyticsRow row : data.rows()) {
        addCell(rowsTable, row.fullName(), false, null);
        addCell(rowsTable, row.teamGroup() == null ? "—" : row.teamGroup().name(), true, null);
        addCell(rowsTable, String.valueOf(row.remote()), true, REMOTE_BG);
        addCell(rowsTable, String.valueOf(row.office()), true, OFFICE_BG);
        addCell(rowsTable, String.valueOf(row.everyoneOffice()), true, DEPLOY_BG);
        addCell(rowsTable, String.valueOf(row.holiday()), true, HOLIDAY_BG);
        addCell(rowsTable, String.valueOf(row.none()), true, null);
        addCell(rowsTable, String.valueOf(row.totalWorkDays()), true, null);
        addCell(rowsTable, row.remotePercent() + " %", true, null);
      }
      doc.add(rowsTable);

      var footer =
          new Paragraph(formatDay(LocalDate.now()) + " tarihinde oluşturuldu", font(9, MUTED_INK));
      footer.setSpacingBefore(12f);
      doc.add(footer);

      doc.close();
      return out.toByteArray();
    }
  }

  public String dashboardFilenameFor(int year, int month, Department department) {
    String dept = department == null ? "tum" : department.name().toLowerCase(Locale.ROOT);
    return String.format("dashboard-%s-%04d-%02d.pdf", dept, year, month);
  }

  private static void addGroupRow(
      PdfPTable table,
      String label,
      Color tint,
      com.team.remotetracker.schedule.analytics.dto.GroupAnalytics group) {
    int avgR = group.memberCount() == 0 ? 0 : group.remoteSum() / group.memberCount();
    int avgO = group.memberCount() == 0 ? 0 : group.officeSum() / group.memberCount();
    addCell(table, label, false, tint);
    addCell(table, String.valueOf(group.memberCount()), true, null);
    addCell(table, avgR + " gün / " + avgO + " gün", true, null);
    addCell(table, group.remotePercent() + " %", true, null);
  }

  private static void addSummaryCard(PdfPTable table, String label, String value, Color tint) {
    var inner = new PdfPTable(1);
    inner.setWidthPercentage(100);
    var labelCell = new PdfPCell(new Phrase(label, fontBold(10, INK)));
    labelCell.setPadding(6f);
    labelCell.setBorder(Rectangle.NO_BORDER);
    inner.addCell(labelCell);
    var valueCell = new PdfPCell(new Phrase(value, fontBold(18, INK)));
    valueCell.setPadding(6f);
    valueCell.setBorder(Rectangle.NO_BORDER);
    inner.addCell(valueCell);
    var wrapper = new PdfPCell(inner);
    wrapper.setBackgroundColor(tint);
    wrapper.setBorderColor(BORDER);
    wrapper.setPadding(4f);
    table.addCell(wrapper);
  }

  private static String dayStatusLabel(DayStatus status, String holidayName, boolean isHalfDay) {
    return switch (status) {
      case REMOTE -> "Remote";
      case OFFICE -> "Ofiste";
      case EVERYONE_OFFICE -> "Tüm ekip ofiste";
      case HOLIDAY -> {
        var base = holidayName == null ? "Resmi tatil" : "Tatil — " + holidayName;
        yield isHalfDay ? base + " (yarım gün)" : base;
      }
      case NONE -> "Plansız";
      case WEEKEND -> "";
    };
  }

  private static String formatDay(LocalDate date) {
    return String.format(
        "%02d.%02d.%04d", date.getDayOfMonth(), date.getMonthValue(), date.getYear());
  }

  private static Color bgFor(DayStatus status, boolean isHalfDay) {
    return switch (status) {
      case REMOTE -> REMOTE_BG;
      case OFFICE -> OFFICE_BG;
      case EVERYONE_OFFICE -> DEPLOY_BG;
      case HOLIDAY -> isHalfDay ? HALF_HOLIDAY_BG : HOLIDAY_BG;
      case NONE, WEEKEND -> Color.WHITE;
    };
  }

  private static void addSummaryRow(PdfPTable table, String label, int count) {
    addCell(table, label, false, null);
    addCell(table, count + " gün", false, null);
  }
}
