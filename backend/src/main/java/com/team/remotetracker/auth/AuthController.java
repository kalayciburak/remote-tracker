package com.team.remotetracker.auth;

import com.team.remotetracker.auth.dto.ChangePasswordRequest;
import com.team.remotetracker.auth.dto.LoginRequest;
import com.team.remotetracker.auth.dto.MessageResponse;
import com.team.remotetracker.auth.dto.TokenResponse;
import com.team.remotetracker.security.CurrentUser;
import com.team.remotetracker.user.dto.UserResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final AuthService service;
  private final CurrentUser currentUser;

  public AuthController(AuthService service, CurrentUser currentUser) {
    this.service = service;
    this.currentUser = currentUser;
  }

  @PostMapping("/login")
  public TokenResponse login(@Valid @RequestBody LoginRequest request) {
    return service.login(request);
  }

  @PostMapping("/change-password")
  public MessageResponse changePassword(@Valid @RequestBody ChangePasswordRequest request) {
    service.changePassword(currentUser.requireId(), request);
    return new MessageResponse("Parola güncellendi");
  }

  @GetMapping("/me")
  public UserResponse me() {
    return service.getCurrentUser(currentUser.requireId());
  }
}
