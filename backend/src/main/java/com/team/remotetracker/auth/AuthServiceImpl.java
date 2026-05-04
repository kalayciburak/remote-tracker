package com.team.remotetracker.auth;

import com.team.remotetracker.auth.dto.ChangePasswordRequest;
import com.team.remotetracker.auth.dto.LoginRequest;
import com.team.remotetracker.auth.dto.TokenResponse;
import com.team.remotetracker.common.exception.ForbiddenException;
import com.team.remotetracker.common.exception.UnauthorizedException;
import com.team.remotetracker.security.JwtService;
import com.team.remotetracker.user.UserService;
import com.team.remotetracker.user.dto.UserResponse;
import com.team.remotetracker.user.entity.User;
import com.team.remotetracker.user.mapper.UserMapper;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class AuthServiceImpl implements AuthService {

  private static final String INVALID_CREDENTIALS = "Kullanıcı adı veya parola hatalı";
  private static final String INACTIVE_ACCOUNT =
      "Hesabınız pasifleştirilmiştir. Lütfen sistem yöneticinizle iletişime geçin.";

  private final JwtService jwtService;
  private final UserService userService;
  private final UserMapper userMapper;

  public AuthServiceImpl(JwtService jwtService, UserService userService, UserMapper userMapper) {
    this.jwtService = jwtService;
    this.userService = userService;
    this.userMapper = userMapper;
  }

  @Override
  public TokenResponse login(LoginRequest request) {
    var user = findOrUnauthorized(request.username());
    requireActive(user);
    requirePasswordMatch(user, request.password());
    var issued = jwtService.issue(user.getId(), user.getUsername(), user.getRole().name());
    return new TokenResponse(issued.accessToken(), issued.expiresAt(), userMapper.toResponse(user));
  }

  @Override
  public void changePassword(UUID userId, ChangePasswordRequest request) {
    userService.changePassword(userId, request.currentPassword(), request.newPassword());
  }

  @Override
  public UserResponse getCurrentUser(UUID userId) {
    return userMapper.toResponse(userService.getEntityById(userId));
  }

  private User findOrUnauthorized(String username) {
    try {
      return userService.getEntityByUsername(username.toLowerCase().trim());
    } catch (Exception ex) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
  }

  private static void requireActive(User user) {
    if (!user.isActive()) throw new ForbiddenException(INACTIVE_ACCOUNT);
  }

  private void requirePasswordMatch(User user, String password) {
    if (!userService.matchesPassword(user, password)) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
  }
}
