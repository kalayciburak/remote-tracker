package com.team.remotetracker.schedule.analytics;

import com.team.remotetracker.holiday.HolidayService;
import com.team.remotetracker.schedule.ScheduleRepository;
import com.team.remotetracker.schedule.analytics.dto.AnalyticsSummary;
import com.team.remotetracker.schedule.analytics.dto.GroupAnalytics;
import com.team.remotetracker.schedule.analytics.dto.MonthAnalyticsResponse;
import com.team.remotetracker.schedule.analytics.dto.UserAnalyticsRow;
import com.team.remotetracker.schedule.entity.DayCode;
import com.team.remotetracker.schedule.entity.WeeklySchedule;
import com.team.remotetracker.user.UserRepository;
import com.team.remotetracker.user.UserService;
import com.team.remotetracker.user.entity.Department;
import com.team.remotetracker.user.entity.Role;
import com.team.remotetracker.user.entity.TeamGroup;
import com.team.remotetracker.user.entity.User;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AnalyticsServiceImpl implements AnalyticsService {

  private final ScheduleRepository scheduleRepository;
  private final UserRepository userRepository;
  private final UserService userService;
  private final HolidayService holidayService;

  public AnalyticsServiceImpl(
      ScheduleRepository scheduleRepository,
      UserRepository userRepository,
      UserService userService,
      HolidayService holidayService) {
    this.scheduleRepository = scheduleRepository;
    this.userRepository = userRepository;
    this.userService = userService;
    this.holidayService = holidayService;
  }

  @Override
  public MonthAnalyticsResponse monthAnalytics(
      UUID actorId, int year, int month, Department requested) {
    User actor = userService.getEntityById(actorId);
    Department department = resolveDepartment(actor, requested);

    YearMonth ym = YearMonth.of(year, month);
    LocalDate firstOfMonth = ym.atDay(1);
    LocalDate lastOfMonth = ym.atEndOfMonth();
    LocalDate firstMonday =
        firstOfMonth.minusDays((firstOfMonth.getDayOfWeek().getValue() + 6) % 7);

    List<User> users =
        userRepository.findAllByActiveTrue().stream()
            .filter(u -> u.getRole() == Role.DEV || u.getRole() == Role.TEST)
            .filter(u -> u.getDepartment() == department)
            .sorted(Comparator.comparing(User::getFullName, String.CASE_INSENSITIVE_ORDER))
            .toList();

    Map<LocalDate, WeeklySchedule> schedulesByMonday =
        loadSchedulesByMonday(department, firstMonday, lastOfMonth);
    Map<LocalDate, String> holidays = loadHolidays(year, lastOfMonth);
    Map<UUID, TeamGroup> groupsAtMonthEnd = userService.teamGroupsAt(users, lastOfMonth);

    int totalWorkDaysInMonth = countWorkDays(firstOfMonth, lastOfMonth, holidays);
    int holidayDaysInMonth = countHolidayWorkDays(firstOfMonth, lastOfMonth, holidays);

    List<UserAnalyticsRow> rows = new ArrayList<>(users.size());
    int totalRemote = 0, totalOffice = 0, totalEveryone = 0, totalNone = 0;
    int groupARemote = 0, groupAOffice = 0, groupAMembers = 0;
    int groupBRemote = 0, groupBOffice = 0, groupBMembers = 0;

    for (User user : users) {
      var counts =
          computeCountsForUser(user, firstOfMonth, lastOfMonth, schedulesByMonday, holidays);
      int planned = counts.remote + counts.office + counts.everyoneOffice;
      int remotePct = planned == 0 ? 0 : (counts.remote * 100) / planned;
      TeamGroup grp = groupsAtMonthEnd.get(user.getId());

      rows.add(
          new UserAnalyticsRow(
              user.getId(),
              user.getUsername(),
              user.getFullName(),
              grp,
              counts.remote,
              counts.office,
              counts.everyoneOffice,
              counts.holiday,
              counts.none,
              totalWorkDaysInMonth,
              remotePct));

      totalRemote += counts.remote;
      totalOffice += counts.office;
      totalEveryone += counts.everyoneOffice;
      totalNone += counts.none;
      if (grp == TeamGroup.A) {
        groupAMembers++;
        groupARemote += counts.remote;
        groupAOffice += counts.office + counts.everyoneOffice;
      } else if (grp == TeamGroup.B) {
        groupBMembers++;
        groupBRemote += counts.remote;
        groupBOffice += counts.office + counts.everyoneOffice;
      }
    }

    GroupAnalytics groupA = buildGroup(groupAMembers, groupARemote, groupAOffice);
    GroupAnalytics groupB = buildGroup(groupBMembers, groupBRemote, groupBOffice);

    AnalyticsSummary summary =
        new AnalyticsSummary(
            totalWorkDaysInMonth,
            totalRemote,
            totalOffice,
            totalEveryone,
            totalNone,
            holidayDaysInMonth,
            groupA,
            groupB);

    return new MonthAnalyticsResponse(year, month, department, summary, rows);
  }

  private Department resolveDepartment(User actor, Department requested) {
    if (actor.getRole().isSuperAdmin()) {
      return requested == null ? Department.DEV : requested;
    }
    return actor.getRole().department();
  }

  private Map<LocalDate, WeeklySchedule> loadSchedulesByMonday(
      Department dept, LocalDate from, LocalDate to) {
    var rows =
        scheduleRepository.findAllByDepartmentAndWeekStartDateBetweenOrderByWeekStartDateAsc(
            dept, from, to);
    Map<LocalDate, WeeklySchedule> map = new HashMap<>();
    rows.forEach(s -> map.put(s.getWeekStartDate(), s));
    return map;
  }

  private Map<LocalDate, String> loadHolidays(int year, LocalDate lastOfMonth) {
    Map<LocalDate, String> holidays = new HashMap<>(holidayService.getHolidayMap(year));
    if (lastOfMonth.getYear() != year) {
      holidays.putAll(holidayService.getHolidayMap(lastOfMonth.getYear()));
    }
    return holidays;
  }

  private static int countWorkDays(
      LocalDate first, LocalDate last, Map<LocalDate, String> holidays) {
    int total = 0;
    for (LocalDate d = first; !d.isAfter(last); d = d.plusDays(1)) {
      if (isWeekend(d)) continue;
      if (holidays.containsKey(d)) continue;
      total++;
    }
    return total;
  }

  private static int countHolidayWorkDays(
      LocalDate first, LocalDate last, Map<LocalDate, String> holidays) {
    int total = 0;
    for (LocalDate d = first; !d.isAfter(last); d = d.plusDays(1)) {
      if (isWeekend(d)) continue;
      if (holidays.containsKey(d)) total++;
    }
    return total;
  }

  private Counts computeCountsForUser(
      User user,
      LocalDate first,
      LocalDate last,
      Map<LocalDate, WeeklySchedule> schedulesByMonday,
      Map<LocalDate, String> holidays) {
    Counts c = new Counts();
    for (LocalDate date = first; !date.isAfter(last); date = date.plusDays(1)) {
      if (isWeekend(date)) continue;
      if (holidays.containsKey(date)) {
        c.holiday++;
        continue;
      }
      LocalDate monday = date.minusDays((date.getDayOfWeek().getValue() + 6) % 7);
      WeeklySchedule schedule = schedulesByMonday.get(monday);
      DayCode code = schedule == null ? null : schedule.codeForDayOfWeek(date.getDayOfWeek());

      if (code == DayCode.OFFICE) {
        c.everyoneOffice++;
        continue;
      }
      if (code == null || code == DayCode.NONE) {
        c.none++;
        continue;
      }
      TeamGroup userGroupForDate = userService.teamGroupAt(user, date);
      if (userGroupForDate == null) {
        c.none++;
        continue;
      }
      boolean isUserGroupCode =
          (code == DayCode.A && userGroupForDate == TeamGroup.A)
              || (code == DayCode.B && userGroupForDate == TeamGroup.B);
      if (isUserGroupCode) c.remote++;
      else c.office++;
    }
    return c;
  }

  private static GroupAnalytics buildGroup(int members, int remote, int office) {
    int planned = remote + office;
    int pct = planned == 0 ? 0 : (remote * 100) / planned;
    return new GroupAnalytics(members, remote, office, pct);
  }

  private static boolean isWeekend(LocalDate date) {
    DayOfWeek dow = date.getDayOfWeek();
    return dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY;
  }

  private static class Counts {
    int remote;
    int office;
    int everyoneOffice;
    int holiday;
    int none;
  }
}
