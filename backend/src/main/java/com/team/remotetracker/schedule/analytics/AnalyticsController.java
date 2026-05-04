package com.team.remotetracker.schedule.analytics;

import com.team.remotetracker.schedule.analytics.dto.MonthAnalyticsResponse;
import com.team.remotetracker.security.CurrentUser;
import com.team.remotetracker.user.entity.Department;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/schedules/analytics")
public class AnalyticsController {

  private final AnalyticsService service;
  private final CurrentUser currentUser;

  public AnalyticsController(AnalyticsService service, CurrentUser currentUser) {
    this.service = service;
    this.currentUser = currentUser;
  }

  @GetMapping("/month/{year}/{month}")
  @PreAuthorize("hasAnyRole('SUPER_ADMIN','TEAM_LEAD_DEV','TEAM_LEAD_TEST')")
  public MonthAnalyticsResponse month(
      @PathVariable int year,
      @PathVariable int month,
      @RequestParam(required = false) Department department) {
    return service.monthAnalytics(currentUser.requireId(), year, month, department);
  }
}
