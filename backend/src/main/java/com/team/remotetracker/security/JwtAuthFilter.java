package com.team.remotetracker.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

  private static final Logger log = LoggerFactory.getLogger(JwtAuthFilter.class);
  private static final String BEARER_PREFIX = "Bearer ";
  private final JwtService jwtService;

  public JwtAuthFilter(JwtService jwtService) {
    this.jwtService = jwtService;
  }

  @Override
  protected void doFilterInternal(
      @NonNull HttpServletRequest request,
      @NonNull HttpServletResponse response,
      @NonNull FilterChain chain)
      throws ServletException, IOException {
    String header = request.getHeader("Authorization");
    if (header == null || !header.startsWith(BEARER_PREFIX)) {
      chain.doFilter(request, response);
      return;
    }
    String token = header.substring(BEARER_PREFIX.length());
    try {
      CustomUserPrincipal principal = jwtService.parsePrincipal(token);
      var authentication =
          new UsernamePasswordAuthenticationToken(
              principal, null, List.of(principal.asAuthority()));
      authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
      SecurityContextHolder.getContext().setAuthentication(authentication);
    } catch (Exception ex) {
      SecurityContextHolder.clearContext();
      request.setAttribute(RestAuthenticationEntryPoint.JWT_ERROR_ATTR, ex.getMessage());
      log.debug("JWT doğrulanamadı: {}", ex.getMessage());
    }
    chain.doFilter(request, response);
  }
}
