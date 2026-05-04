package com.team.remotetracker.auth;

import com.team.remotetracker.auth.dto.ChangePasswordRequest;
import com.team.remotetracker.auth.dto.LoginRequest;
import com.team.remotetracker.auth.dto.TokenResponse;
import com.team.remotetracker.user.dto.UserResponse;
import java.util.UUID;

public interface AuthService {

  TokenResponse login(LoginRequest request);

  void changePassword(UUID userId, ChangePasswordRequest request);

  UserResponse getCurrentUser(UUID userId);
}
