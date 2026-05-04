package com.team.remotetracker.security;

import com.team.remotetracker.common.exception.UnauthorizedException;
import java.util.Optional;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class CurrentUser {

  public Optional<CustomUserPrincipal> find() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null
        || !auth.isAuthenticated()
        || !(auth.getPrincipal() instanceof CustomUserPrincipal p)) {
      return Optional.empty();
    }
    return Optional.of(p);
  }

  public CustomUserPrincipal require() {
    return find().orElseThrow(() -> new UnauthorizedException("Oturum gerekli"));
  }

  public UUID requireId() {
    return require().id();
  }

  public boolean isAdmin() {
    return find().map(CustomUserPrincipal::isAdmin).orElse(false);
  }
}
