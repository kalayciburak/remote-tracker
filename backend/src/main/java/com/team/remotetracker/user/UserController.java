package com.team.remotetracker.user;

import com.team.remotetracker.common.exception.NotFoundException;
import com.team.remotetracker.config.AppProperties;
import com.team.remotetracker.security.CurrentUser;
import com.team.remotetracker.user.dto.CreateUserRequest;
import com.team.remotetracker.user.dto.CreateUserResponse;
import com.team.remotetracker.user.dto.ShuffleResponse;
import com.team.remotetracker.user.dto.UpdateGroupRequest;
import com.team.remotetracker.user.dto.UpdateProfileRequest;
import com.team.remotetracker.user.dto.UpdateUserRequest;
import com.team.remotetracker.user.dto.UserResponse;
import com.team.remotetracker.user.entity.Department;
import com.team.remotetracker.user.entity.Role;
import com.team.remotetracker.user.entity.TeamGroup;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

  private final UserService service;
  private final CurrentUser currentUser;
  private final AppProperties properties;
  private final TeamShuffleService shuffleService;

  public UserController(
      UserService service,
      CurrentUser currentUser,
      AppProperties properties,
      TeamShuffleService shuffleService) {
    this.service = service;
    this.currentUser = currentUser;
    this.properties = properties;
    this.shuffleService = shuffleService;
  }

  @GetMapping
  public List<UserResponse> list(
      @RequestParam(required = false) Department department,
      @RequestParam(required = false) TeamGroup group,
      @RequestParam(required = false) Role role,
      @RequestParam(required = false) Boolean active,
      @RequestParam(required = false) Boolean firstLogin,
      @RequestParam(required = false) String search,
      @RequestParam(required = false) LocalDate asOf) {
    var responses = service.list(department, group, role, active, firstLogin, search, asOf);
    if (isCallerBootstrap()) return responses;
    String bootstrap = bootstrapUsername();
    return responses.stream().filter(r -> !r.username().equalsIgnoreCase(bootstrap)).toList();
  }

  @GetMapping("/{id}")
  public UserResponse getById(@PathVariable UUID id) {
    requireBootstrapVisibility(id);
    return service.getById(id);
  }

  @PostMapping
  @PreAuthorize("hasAnyRole('SUPER_ADMIN','TEAM_LEAD_DEV','TEAM_LEAD_TEST')")
  @ResponseStatus(HttpStatus.CREATED)
  public CreateUserResponse create(@Valid @RequestBody CreateUserRequest request) {
    return service.createByAdmin(currentUser.requireId(), request);
  }

  @PutMapping("/{id}")
  @PreAuthorize("hasAnyRole('SUPER_ADMIN','TEAM_LEAD_DEV','TEAM_LEAD_TEST')")
  public UserResponse update(@PathVariable UUID id, @Valid @RequestBody UpdateUserRequest request) {
    requireBootstrapVisibility(id);
    return service.update(currentUser.requireId(), id, request);
  }

  @PatchMapping("/me/profile")
  @PreAuthorize("isAuthenticated()")
  public UserResponse updateMyProfile(@Valid @RequestBody UpdateProfileRequest request) {
    return service.updateMyProfile(currentUser.requireId(), request);
  }

  @PostMapping("/team-shuffle")
  @PreAuthorize("hasAnyRole('SUPER_ADMIN','TEAM_LEAD_DEV','TEAM_LEAD_TEST')")
  public ShuffleResponse teamShuffle(@RequestParam Department department) {
    var actor = service.getEntityById(currentUser.requireId());
    shuffleService.requireCanShuffle(actor, department);
    return shuffleService.proposeShuffle(department);
  }

  @PatchMapping("/{id}/group")
  @PreAuthorize("hasAnyRole('SUPER_ADMIN','TEAM_LEAD_DEV','TEAM_LEAD_TEST')")
  public UserResponse updateGroup(
      @PathVariable UUID id, @Valid @RequestBody UpdateGroupRequest request) {
    requireBootstrapVisibility(id);
    return service.updateGroup(currentUser.requireId(), id, request);
  }

  @PostMapping("/{id}/reset-password")
  @PreAuthorize("hasAnyRole('SUPER_ADMIN','TEAM_LEAD_DEV','TEAM_LEAD_TEST')")
  public CreateUserResponse resetPassword(@PathVariable UUID id) {
    requireBootstrapVisibility(id);
    return service.resetPassword(currentUser.requireId(), id);
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasAnyRole('SUPER_ADMIN','TEAM_LEAD_DEV','TEAM_LEAD_TEST')")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void softDelete(@PathVariable UUID id) {
    requireBootstrapVisibility(id);
    service.softDelete(currentUser.requireId(), id);
  }

  private String bootstrapUsername() {
    return properties.security().bootstrapUsername();
  }

  private boolean isCallerBootstrap() {
    return currentUser
        .find()
        .map(p -> p.username().equalsIgnoreCase(bootstrapUsername()))
        .orElse(false);
  }

  private void requireBootstrapVisibility(UUID targetId) {
    if (isCallerBootstrap()) return;
    var target = service.getEntityById(targetId);
    if (target.getUsername().equalsIgnoreCase(bootstrapUsername())) {
      throw new NotFoundException("Kullanıcı bulunamadı");
    }
  }
}
