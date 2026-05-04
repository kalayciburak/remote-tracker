package com.team.remotetracker.schedule;

import com.team.remotetracker.common.exception.BusinessRuleException;
import com.team.remotetracker.common.exception.ForbiddenException;
import com.team.remotetracker.holiday.HolidayService;
import com.team.remotetracker.schedule.dto.DayStatusResponse;
import com.team.remotetracker.schedule.dto.ScheduleResponse;
import com.team.remotetracker.schedule.dto.SetDayRequest;
import com.team.remotetracker.schedule.entity.DayCode;
import com.team.remotetracker.schedule.entity.DayStatus;
import com.team.remotetracker.schedule.entity.LeadScheduleTemplate;
import com.team.remotetracker.schedule.entity.LeadStatus;
import com.team.remotetracker.schedule.entity.WeeklySchedule;
import com.team.remotetracker.schedule.lead.LeadScheduleDayRepository;
import com.team.remotetracker.schedule.lead.LeadTemplateRepository;
import com.team.remotetracker.schedule.mapper.ScheduleMapper;
import com.team.remotetracker.user.UserService;
import com.team.remotetracker.user.entity.Department;
import com.team.remotetracker.user.entity.Role;
import com.team.remotetracker.user.entity.TeamGroup;
import com.team.remotetracker.user.entity.User;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ScheduleServiceImpl implements ScheduleService {

  private static final int CALENDAR_GRID_DAYS = 42;

  private final ScheduleRepository repository;
  private final ScheduleMapper mapper;
  private final UserService userService;
  private final HolidayService holidayService;
  private final LeadTemplateRepository leadTemplateRepository;
  private final LeadScheduleDayRepository leadScheduleDayRepository;

  public ScheduleServiceImpl(
      ScheduleRepository repository,
      ScheduleMapper mapper,
      UserService userService,
      HolidayService holidayService,
      LeadTemplateRepository leadTemplateRepository,
      LeadScheduleDayRepository leadScheduleDayRepository) {
    this.repository = repository;
    this.mapper = mapper;
    this.userService = userService;
    this.holidayService = holidayService;
    this.leadTemplateRepository = leadTemplateRepository;
    this.leadScheduleDayRepository = leadScheduleDayRepository;
  }

  @Override
  public List<ScheduleResponse> findMonth(int year, int month, Department department) {
    var first = YearMonth.of(year, month).atDay(1);
    var from = startOfWeekMonday(first);
    var to = YearMonth.of(year, month).atEndOfMonth();
    var rows =
        department == null
            ? repository.findAllByWeekStartDateBetweenOrderByWeekStartDateAsc(from, to)
            : repository.findAllByDepartmentAndWeekStartDateBetweenOrderByWeekStartDateAsc(
                department, from, to);
    return rows.stream().map(mapper::toResponse).toList();
  }

  @Override
  public List<DayStatusResponse> findMyMonth(UUID userId, int year, int month) {
    var user = userService.getEntityById(userId);
    var firstOfMonth = YearMonth.of(year, month).atDay(1);
    var gridStart = startOfWeekMonday(firstOfMonth);
    var rangeFrom = gridStart;
    var rangeTo = gridStart.plusDays(CALENDAR_GRID_DAYS - 1);

    var schedulesByMonday = loadSchedulesForUser(user, rangeFrom, rangeTo);
    var holidays = holidayService.getHolidayMap(year);
    if (year != rangeTo.getYear()) holidays.putAll(holidayService.getHolidayMap(rangeTo.getYear()));

    LeadScheduleTemplate leadTemplate =
        user.getRole().isTeamLead()
            ? leadTemplateRepository.findById(user.getId()).orElse(null)
            : null;
    var leadOverrides = new HashMap<LocalDate, LeadStatus>();
    if (user.getRole().isTeamLead()) {
      leadScheduleDayRepository
          .findAllByLeadUserIdAndDateBetween(user.getId(), rangeFrom, rangeTo)
          .forEach(d -> leadOverrides.put(d.getDate(), d.getStatus()));
    }

    var result = new ArrayList<DayStatusResponse>(CALENDAR_GRID_DAYS);
    for (int i = 0; i < CALENDAR_GRID_DAYS; i++) {
      var date = gridStart.plusDays(i);
      result.add(
          buildDayStatus(
              user,
              userService.teamGroupAt(user, date),
              date,
              schedulesByMonday,
              holidays,
              leadTemplate,
              leadOverrides));
    }
    return result;
  }

  @Override
  @Transactional
  public ScheduleResponse setDay(UUID actorId, SetDayRequest request) {
    var actor = userService.getEntityById(actorId);
    requireCanWriteDepartment(actor, request.department());
    requireWorkDay(request.date());
    requireNotHoliday(request.date());
    var monday = startOfWeekMonday(request.date());
    var schedule =
        repository
            .findByDepartmentAndWeekStartDate(request.department(), monday)
            .orElseGet(() -> initSchedule(actor, request.department(), monday));

    setCode(schedule, request.date().getDayOfWeek(), request.code());
    if (schedule.getId() == null) repository.save(schedule);
    return mapper.toResponse(schedule);
  }

  @Override
  @Transactional
  public ScheduleResponse setNote(
      UUID actorId, Department department, LocalDate weekStartDate, String note) {
    var actor = userService.getEntityById(actorId);
    requireCanWriteDepartment(actor, department);
    if (weekStartDate.getDayOfWeek() != DayOfWeek.MONDAY) {
      throw new BusinessRuleException(
          HttpStatus.BAD_REQUEST, "NOT_MONDAY", "Hafta başlangıcı Pazartesi olmalı");
    }
    var schedule =
        repository
            .findByDepartmentAndWeekStartDate(department, weekStartDate)
            .orElseGet(() -> initSchedule(actor, department, weekStartDate));
    schedule.setNote(note == null || note.isBlank() ? null : note.trim());
    if (schedule.getId() == null) repository.save(schedule);
    return mapper.toResponse(schedule);
  }

  private WeeklySchedule initSchedule(User actor, Department department, LocalDate monday) {
    var s = new WeeklySchedule();
    s.setDepartment(department);
    s.setWeekStartDate(monday);
    s.setMonday(DayCode.NONE);
    s.setTuesday(DayCode.NONE);
    s.setWednesday(DayCode.NONE);
    s.setThursday(DayCode.NONE);
    s.setFriday(DayCode.NONE);
    s.setCreatedBy(actor);
    return s;
  }

  private static void setCode(WeeklySchedule schedule, DayOfWeek dow, DayCode code) {
    switch (dow) {
      case MONDAY -> schedule.setMonday(code);
      case TUESDAY -> schedule.setTuesday(code);
      case WEDNESDAY -> schedule.setWednesday(code);
      case THURSDAY -> schedule.setThursday(code);
      case FRIDAY -> schedule.setFriday(code);
      default ->
          throw new BusinessRuleException(
              HttpStatus.BAD_REQUEST, "WEEKEND_NOT_ALLOWED", "Hafta sonu için kod atanamaz");
    }
  }

  private static void requireWorkDay(LocalDate date) {
    var dow = date.getDayOfWeek();
    if (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY) {
      throw new BusinessRuleException(
          HttpStatus.BAD_REQUEST, "WEEKEND_NOT_ALLOWED", "Hafta sonu için plan girilemez");
    }
  }

  private void requireNotHoliday(LocalDate date) {
    var year = date.getYear();
    var holidayName = holidayService.getHolidayMap(year).get(date);
    if (holidayName == null) return;
    if (holidayService.getHalfDayHolidays(year).contains(date)) return;
    throw new BusinessRuleException(
        HttpStatus.BAD_REQUEST,
        "HOLIDAY_NOT_ALLOWED",
        "Resmi tatilde planlama yapılamaz: " + holidayName);
  }

  private static void requireCanWriteDepartment(User actor, Department department) {
    if (!actor.getRole().canManageDepartment(department)) {
      throw new ForbiddenException("Bu departmanın planını düzenleyemezsiniz");
    }
  }

  private static LocalDate startOfWeekMonday(LocalDate date) {
    int daysFromMonday = date.getDayOfWeek().getValue() - DayOfWeek.MONDAY.getValue();
    return date.minusDays(daysFromMonday);
  }

  private Map<LocalDate, WeeklySchedule> loadSchedulesForUser(
      User user, LocalDate from, LocalDate to) {
    var dept = user.getDepartment();
    var rows =
        dept == null
            ? repository.findAllByWeekStartDateBetweenOrderByWeekStartDateAsc(from, to)
            : repository.findAllByDepartmentAndWeekStartDateBetweenOrderByWeekStartDateAsc(
                dept, from, to);
    var map = new HashMap<LocalDate, WeeklySchedule>();
    rows.forEach(s -> map.put(s.getWeekStartDate(), s));
    return map;
  }

  private static DayStatusResponse buildDayStatus(
      User user,
      TeamGroup teamGroup,
      LocalDate date,
      Map<LocalDate, WeeklySchedule> schedulesByMonday,
      Map<LocalDate, String> holidays,
      LeadScheduleTemplate leadTemplate,
      Map<LocalDate, LeadStatus> leadOverrides) {
    var dow = date.getDayOfWeek();
    if (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY) {
      return new DayStatusResponse(date, DayStatus.WEEKEND, null);
    }

    var monday = startOfWeekMonday(date);
    var schedule = schedulesByMonday.get(monday);
    DayCode code = schedule == null ? null : schedule.codeForDayOfWeek(dow);

    String holidayName = holidays.get(date);
    if (holidayName != null) {
      return new DayStatusResponse(date, DayStatus.HOLIDAY, holidayName);
    }

    if (code == DayCode.OFFICE) return new DayStatusResponse(date, DayStatus.EVERYONE_OFFICE, null);

    if (user.getRole().isTeamLead()) {
      LeadStatus leadStatus = leadOverrides.get(date);
      if (leadStatus == null && leadTemplate != null) {
        leadStatus = leadTemplate.statusForDow(dow);
      }
      if (leadStatus == LeadStatus.REMOTE)
        return new DayStatusResponse(date, DayStatus.REMOTE, null);
      if (leadStatus == LeadStatus.OFFICE)
        return new DayStatusResponse(date, DayStatus.OFFICE, null);
      return new DayStatusResponse(date, DayStatus.NONE, null);
    }

    if (code == null || code == DayCode.NONE) {
      return new DayStatusResponse(date, DayStatus.NONE, null);
    }

    if (user.getRole() == Role.SUPER_ADMIN || teamGroup == null) {
      return new DayStatusResponse(date, DayStatus.NONE, null);
    }

    boolean isUserGroupCode =
        (code == DayCode.A && teamGroup == TeamGroup.A)
            || (code == DayCode.B && teamGroup == TeamGroup.B);
    return new DayStatusResponse(date, isUserGroupCode ? DayStatus.REMOTE : DayStatus.OFFICE, null);
  }
}
