package com.team.remotetracker.export;

import com.team.remotetracker.common.exception.ForbiddenException;
import com.team.remotetracker.security.CurrentUser;
import com.team.remotetracker.user.UserService;
import com.team.remotetracker.user.entity.Department;
import java.io.IOException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/exports")
public class ExportController {

  private final ExportService exportService;
  private final UserService userService;
  private final CurrentUser currentUser;

  public ExportController(
      ExportService exportService, UserService userService, CurrentUser currentUser) {
    this.exportService = exportService;
    this.userService = userService;
    this.currentUser = currentUser;
  }

  @GetMapping("/schedule.pdf")
  @PreAuthorize("hasAnyRole('SUPER_ADMIN','TEAM_LEAD_DEV','TEAM_LEAD_TEST')")
  public ResponseEntity<byte[]> pdf(
      @RequestParam int year,
      @RequestParam int month,
      @RequestParam(required = false) Department department)
      throws IOException {
    Department effective = resolveDepartment(department);
    var bytes = exportService.exportMonthPdf(year, month, effective);
    return ResponseEntity.ok()
        .header(
            HttpHeaders.CONTENT_DISPOSITION,
            "attachment; filename=\""
                + exportService.filenameFor(year, month, effective, "pdf")
                + "\"")
        .contentType(MediaType.APPLICATION_PDF)
        .body(bytes);
  }

  @GetMapping("/leads.pdf")
  @PreAuthorize("hasAnyRole('SUPER_ADMIN','TEAM_LEAD_DEV','TEAM_LEAD_TEST')")
  public ResponseEntity<byte[]> leadsPdf(
      @RequestParam int year,
      @RequestParam int month,
      @RequestParam(required = false) Department department)
      throws IOException {
    Department effective = resolveDepartment(department);
    var bytes = exportService.exportLeadsPdf(year, month, effective);
    return ResponseEntity.ok()
        .header(
            HttpHeaders.CONTENT_DISPOSITION,
            "attachment; filename=\""
                + exportService.leadsFilenameFor(year, month, effective)
                + "\"")
        .contentType(MediaType.APPLICATION_PDF)
        .body(bytes);
  }

  @GetMapping("/dashboard.pdf")
  @PreAuthorize("hasAnyRole('SUPER_ADMIN','TEAM_LEAD_DEV','TEAM_LEAD_TEST')")
  public ResponseEntity<byte[]> dashboardPdf(
      @RequestParam int year,
      @RequestParam int month,
      @RequestParam(required = false) Department department)
      throws IOException {
    java.util.UUID actorId = currentUser.requireId();
    byte[] bytes = exportService.exportDashboardPdf(actorId, year, month, department);
    Department effective =
        userService.getEntityById(actorId).getRole().isSuperAdmin()
            ? (department == null ? Department.DEV : department)
            : userService.getEntityById(actorId).getRole().department();
    String filename = exportService.dashboardFilenameFor(year, month, effective);
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
        .contentType(MediaType.APPLICATION_PDF)
        .body(bytes);
  }

  @GetMapping("/me.pdf")
  public ResponseEntity<byte[]> myPdf(@RequestParam int year, @RequestParam int month)
      throws IOException {
    java.util.UUID userId = currentUser.requireId();
    byte[] bytes = exportService.exportMyMonthPdf(userId, year, month);
    String filename = exportService.myMonthFilenameFor(userId, year, month);
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
        .contentType(MediaType.APPLICATION_PDF)
        .body(bytes);
  }

  private Department resolveDepartment(Department requested) {
    var actor = userService.getEntityById(currentUser.requireId());
    if (actor.getRole().isSuperAdmin()) return requested;
    var ownDept = actor.getDepartment();
    if (requested == null) return ownDept;
    if (requested != ownDept) {
      throw new ForbiddenException("Sadece kendi departmanınızı dışa aktarabilirsiniz");
    }
    return ownDept;
  }
}
