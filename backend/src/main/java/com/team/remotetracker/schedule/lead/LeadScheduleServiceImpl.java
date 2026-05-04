package com.team.remotetracker.schedule.lead;

import com.team.remotetracker.common.exception.BusinessRuleException;
import com.team.remotetracker.common.exception.ForbiddenException;
import com.team.remotetracker.common.exception.NotFoundException;
import com.team.remotetracker.holiday.HolidayService;
import com.team.remotetracker.schedule.entity.LeadScheduleDay;
import com.team.remotetracker.schedule.entity.LeadScheduleTemplate;
import com.team.remotetracker.schedule.entity.LeadStatus;
import com.team.remotetracker.schedule.lead.dto.LeadDayResponse;
import com.team.remotetracker.schedule.lead.dto.LeadTemplateRequest;
import com.team.remotetracker.schedule.lead.dto.LeadTemplateResponse;
import com.team.remotetracker.schedule.lead.dto.SetLeadDayRequest;
import com.team.remotetracker.user.UserRepository;
import com.team.remotetracker.user.UserService;
import com.team.remotetracker.user.dto.UserSummary;
import com.team.remotetracker.user.entity.Department;
import com.team.remotetracker.user.entity.Role;
import com.team.remotetracker.user.entity.User;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class LeadScheduleServiceImpl implements LeadScheduleService {

  private static final int CALENDAR_GRID_DAYS = 42;

  private final LeadTemplateRepository templateRepository;
  private final LeadScheduleDayRepository dayRepository;
  private final UserRepository userRepository;
  private final UserService userService;
  private final HolidayService holidayService;

  public LeadScheduleServiceImpl(
      LeadTemplateRepository templateRepository,
      LeadScheduleDayRepository dayRepository,
      UserRepository userRepository,
      UserService userService,
      HolidayService holidayService) {
    this.templateRepository = templateRepository;
    this.dayRepository = dayRepository;
    this.userRepository = userRepository;
    this.userService = userService;
    this.holidayService = holidayService;
  }

  @Override
  public List<LeadTemplateResponse> listTemplates(Department department) {
    var leads = leadsByDepartment(department);
    return leads.stream().map(l -> toResponse(l, getOrInit(l.getId()))).toList();
  }

  @Override
  public LeadTemplateResponse getTemplate(UUID leadUserId) {
    var lead = requireLead(leadUserId);
    return toResponse(lead, getOrInit(leadUserId));
  }

  @Override
  @Transactional
  public LeadTemplateResponse upsertTemplate(
      UUID actorId, UUID leadUserId, LeadTemplateRequest request) {
    var actor = userService.getEntityById(actorId);
    var lead = requireLead(leadUserId);
    requireCanWriteLead(actor, lead);
    var template = getOrInit(leadUserId);
    template.setMonday(request.monday());
    template.setTuesday(request.tuesday());
    template.setWednesday(request.wednesday());
    template.setThursday(request.thursday());
    template.setFriday(request.friday());
    var saved = templateRepository.save(template);
    return toResponse(lead, saved);
  }

  @Override
  @Transactional
  public LeadDayResponse setDay(UUID actorId, SetLeadDayRequest request) {
    var actor = userService.getEntityById(actorId);
    var lead = requireLead(request.leadUserId());
    requireCanWriteLead(actor, lead);
    requireWorkDay(request.date());
    requireNotHoliday(request.date());

    var day =
        dayRepository
            .findByLeadUserIdAndDate(request.leadUserId(), request.date())
            .orElseGet(
                () -> {
                  var d = new LeadScheduleDay();
                  d.setLeadUserId(request.leadUserId());
                  d.setDate(request.date());
                  return d;
                });
    day.setStatus(request.status());

    var saved = dayRepository.save(day);
    return new LeadDayResponse(
        new UserSummary(lead.getId(), lead.getFullName()), saved.getDate(), saved.getStatus());
  }

  @Override
  public List<LeadDayResponse> findMonth(int year, int month, Department department) {
    var leads = leadsByDepartment(department);
    if (leads.isEmpty()) return List.of();

    var firstOfMonth = YearMonth.of(year, month).atDay(1);
    var gridStart = startOfWeekMonday(firstOfMonth);
    var gridEnd = gridStart.plusDays(CALENDAR_GRID_DAYS - 1);

    var templates = new HashMap<UUID, LeadScheduleTemplate>();
    for (var l : leads) templates.put(l.getId(), getOrInit(l.getId()));

    var leadIds = leads.stream().map(User::getId).toList();
    var overrideMap = new HashMap<UUID, HashMap<LocalDate, LeadStatus>>();
    for (var d : dayRepository.findAllByLeadUserIdInAndDateBetween(leadIds, gridStart, gridEnd)) {
      overrideMap
          .computeIfAbsent(d.getLeadUserId(), id -> new HashMap<>())
          .put(d.getDate(), d.getStatus());
    }

    var result = new ArrayList<LeadDayResponse>();
    for (var lead : leads) {
      var overrides = overrideMap.get(lead.getId());
      for (int i = 0; i < CALENDAR_GRID_DAYS; i++) {
        var date = gridStart.plusDays(i);
        var dow = date.getDayOfWeek();
        if (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY) continue;
        var status =
            overrides != null && overrides.containsKey(date)
                ? overrides.get(date)
                : templates.get(lead.getId()).statusForDow(dow);
        if (status == null) continue;
        result.add(
            new LeadDayResponse(new UserSummary(lead.getId(), lead.getFullName()), date, status));
      }
    }
    return result;
  }

  private List<User> leadsByDepartment(Department department) {
    var allLeads =
        userRepository.findAllByActiveTrue().stream()
            .filter(u -> u.getRole().isTeamLead())
            .toList();
    if (department == null) return allLeads;
    return allLeads.stream().filter(u -> u.getDepartment() == department).toList();
  }

  private User requireLead(UUID leadUserId) {
    var user =
        userRepository
            .findById(leadUserId)
            .orElseThrow(() -> new NotFoundException("Takım lideri bulunamadı"));
    if (!user.getRole().isTeamLead()) {
      throw new BusinessRuleException("NOT_TEAM_LEAD", "Bu kullanıcı takım lideri değil");
    }
    return user;
  }

  private static void requireCanWriteLead(User actor, User lead) {
    if (actor.getRole() == Role.SUPER_ADMIN) return;
    if (actor.getId().equals(lead.getId())) return;
    throw new ForbiddenException("Sadece kendi lead takviminizi düzenleyebilirsiniz");
  }

  private static void requireWorkDay(LocalDate date) {
    var dow = date.getDayOfWeek();
    if (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY) {
      throw new BusinessRuleException(
          org.springframework.http.HttpStatus.BAD_REQUEST,
          "WEEKEND_NOT_ALLOWED",
          "Hafta sonu için lead planı girilemez");
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
        "Resmi tatilde lead planı girilemez: " + holidayName);
  }

  private LeadScheduleTemplate getOrInit(UUID leadUserId) {
    return templateRepository
        .findById(leadUserId)
        .orElseGet(
            () -> {
              var t = new LeadScheduleTemplate();
              t.setLeadUserId(leadUserId);
              return t;
            });
  }

  private static LeadTemplateResponse toResponse(User lead, LeadScheduleTemplate t) {
    return new LeadTemplateResponse(
        new UserSummary(lead.getId(), lead.getFullName()),
        t.getMonday(),
        t.getTuesday(),
        t.getWednesday(),
        t.getThursday(),
        t.getFriday());
  }

  private static LocalDate startOfWeekMonday(LocalDate date) {
    int daysFromMonday = date.getDayOfWeek().getValue() - DayOfWeek.MONDAY.getValue();
    return date.minusDays(daysFromMonday);
  }
}
