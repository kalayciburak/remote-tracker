package com.team.remotetracker.holiday;

import com.team.remotetracker.holiday.dto.CreateHolidayRequest;
import com.team.remotetracker.holiday.dto.HolidayResponse;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.time.Year;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/holidays")
public class HolidayController {

  private final HolidayService service;
  private final HolidaySyncService syncService;

  public HolidayController(HolidayService service, HolidaySyncService syncService) {
    this.service = service;
    this.syncService = syncService;
  }

  @GetMapping
  public List<HolidayResponse> list(@RequestParam(required = false) Integer year) {
    int target = year != null ? year : Year.now().getValue();
    return service.getHolidays(target);
  }

  @PostMapping
  @PreAuthorize("hasAnyRole('SUPER_ADMIN','TEAM_LEAD_DEV','TEAM_LEAD_TEST')")
  @ResponseStatus(HttpStatus.CREATED)
  public HolidayResponse add(@Valid @RequestBody CreateHolidayRequest request) {
    return service.addManual(request);
  }

  @DeleteMapping("/{date}")
  @PreAuthorize("hasAnyRole('SUPER_ADMIN','TEAM_LEAD_DEV','TEAM_LEAD_TEST')")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
    service.delete(date);
  }

  @PatchMapping("/{date}/half-day")
  @PreAuthorize("hasAnyRole('SUPER_ADMIN','TEAM_LEAD_DEV','TEAM_LEAD_TEST')")
  public HolidayResponse setHalfDay(
      @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
      @RequestParam boolean isHalfDay) {
    return service.setHalfDay(date, isHalfDay);
  }

  @PostMapping("/sync/{year}")
  @PreAuthorize("hasAnyRole('SUPER_ADMIN','TEAM_LEAD_DEV','TEAM_LEAD_TEST')")
  public int sync(@PathVariable int year) {
    return syncService.syncYear(year);
  }
}
