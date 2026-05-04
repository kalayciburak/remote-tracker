package com.team.remotetracker.schedule;

import com.team.remotetracker.schedule.dto.DayStatusResponse;
import com.team.remotetracker.schedule.dto.ScheduleResponse;
import com.team.remotetracker.schedule.dto.SetDayRequest;
import com.team.remotetracker.security.CurrentUser;
import com.team.remotetracker.user.entity.Department;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/schedules")
public class ScheduleController {

  private final ScheduleService service;
  private final CurrentUser currentUser;

  public ScheduleController(ScheduleService service, CurrentUser currentUser) {
    this.service = service;
    this.currentUser = currentUser;
  }

  @GetMapping("/month/{year}/{month}")
  @PreAuthorize("hasAnyRole('SUPER_ADMIN','TEAM_LEAD_DEV','TEAM_LEAD_TEST')")
  public List<ScheduleResponse> month(
      @PathVariable int year,
      @PathVariable int month,
      @RequestParam(required = false) Department department) {
    return service.findMonth(year, month, department);
  }

  @GetMapping("/me/month/{year}/{month}")
  public List<DayStatusResponse> myMonth(@PathVariable int year, @PathVariable int month) {
    return service.findMyMonth(currentUser.requireId(), year, month);
  }

  @PutMapping("/day")
  @PreAuthorize("hasAnyRole('SUPER_ADMIN','TEAM_LEAD_DEV','TEAM_LEAD_TEST')")
  public ScheduleResponse setDay(@Valid @RequestBody SetDayRequest request) {
    return service.setDay(currentUser.requireId(), request);
  }

  @PutMapping("/note")
  @PreAuthorize("hasAnyRole('SUPER_ADMIN','TEAM_LEAD_DEV','TEAM_LEAD_TEST')")
  public ScheduleResponse setNote(
      @RequestParam Department department,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStartDate,
      @RequestParam(required = false) String note) {
    return service.setNote(currentUser.requireId(), department, weekStartDate, note);
  }
}
