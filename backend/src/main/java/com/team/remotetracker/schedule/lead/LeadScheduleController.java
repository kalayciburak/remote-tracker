package com.team.remotetracker.schedule.lead;

import com.team.remotetracker.schedule.lead.dto.LeadDayResponse;
import com.team.remotetracker.schedule.lead.dto.LeadTemplateRequest;
import com.team.remotetracker.schedule.lead.dto.LeadTemplateResponse;
import com.team.remotetracker.schedule.lead.dto.SetLeadDayRequest;
import com.team.remotetracker.security.CurrentUser;
import com.team.remotetracker.user.entity.Department;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/lead-schedules")
public class LeadScheduleController {

  private final LeadScheduleService service;
  private final CurrentUser currentUser;

  public LeadScheduleController(LeadScheduleService service, CurrentUser currentUser) {
    this.service = service;
    this.currentUser = currentUser;
  }

  @GetMapping("/templates")
  @PreAuthorize("hasAnyRole('SUPER_ADMIN','TEAM_LEAD_DEV','TEAM_LEAD_TEST')")
  public List<LeadTemplateResponse> listTemplates(
      @RequestParam(required = false) Department department) {
    return service.listTemplates(department);
  }

  @GetMapping("/templates/{leadUserId}")
  @PreAuthorize("hasAnyRole('SUPER_ADMIN','TEAM_LEAD_DEV','TEAM_LEAD_TEST')")
  public LeadTemplateResponse getTemplate(@PathVariable UUID leadUserId) {
    return service.getTemplate(leadUserId);
  }

  @PutMapping("/templates/{leadUserId}")
  @PreAuthorize("hasAnyRole('SUPER_ADMIN','TEAM_LEAD_DEV','TEAM_LEAD_TEST')")
  public LeadTemplateResponse upsertTemplate(
      @PathVariable UUID leadUserId, @Valid @RequestBody LeadTemplateRequest request) {
    return service.upsertTemplate(currentUser.requireId(), leadUserId, request);
  }

  @PutMapping("/day")
  @PreAuthorize("hasAnyRole('SUPER_ADMIN','TEAM_LEAD_DEV','TEAM_LEAD_TEST')")
  public LeadDayResponse setDay(@Valid @RequestBody SetLeadDayRequest request) {
    return service.setDay(currentUser.requireId(), request);
  }

  @GetMapping("/month/{year}/{month}")
  @PreAuthorize("hasAnyRole('SUPER_ADMIN','TEAM_LEAD_DEV','TEAM_LEAD_TEST')")
  public List<LeadDayResponse> month(
      @PathVariable int year,
      @PathVariable int month,
      @RequestParam(required = false) Department department) {
    return service.findMonth(year, month, department);
  }
}
