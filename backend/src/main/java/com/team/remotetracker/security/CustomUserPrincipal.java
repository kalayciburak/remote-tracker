package com.team.remotetracker.security;

import java.util.UUID;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

public record CustomUserPrincipal(UUID id, String username, String role) {

  public GrantedAuthority asAuthority() {
    return new SimpleGrantedAuthority("ROLE_" + role);
  }

  public boolean isAdmin() {
    return "ADMIN".equalsIgnoreCase(role);
  }
}
