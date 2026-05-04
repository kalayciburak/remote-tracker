package com.team.remotetracker.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URI;
import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

@Component
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

  static final String JWT_ERROR_ATTR = "jwtAuthError";

  private static final String CODE_UNAUTHORIZED = "UNAUTHORIZED";
  private static final String DEFAULT_DETAIL = "Kimlik doğrulanamadı";
  private static final String TYPE_PREFIX = "urn:remote-tracker:";

  private final ObjectMapper objectMapper;

  public RestAuthenticationEntryPoint(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  @Override
  public void commence(
      HttpServletRequest request,
      HttpServletResponse response,
      AuthenticationException authException)
      throws IOException {
    ProblemDetail body = buildBody(request, resolveDetail(request, authException));
    response.setStatus(HttpStatus.UNAUTHORIZED.value());
    response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
    objectMapper.writeValue(response.getOutputStream(), body);
  }

  private String resolveDetail(HttpServletRequest request, AuthenticationException ex) {
    Object attr = request.getAttribute(JWT_ERROR_ATTR);
    if (attr instanceof String s && !s.isBlank()) return s;
    if (ex != null && ex.getMessage() != null && !ex.getMessage().isBlank()) return ex.getMessage();
    return DEFAULT_DETAIL;
  }

  private ProblemDetail buildBody(HttpServletRequest request, String detail) {
    ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, detail);
    pd.setTitle(HttpStatus.UNAUTHORIZED.getReasonPhrase());
    pd.setType(URI.create(TYPE_PREFIX + CODE_UNAUTHORIZED.toLowerCase().replace('_', '-')));
    pd.setInstance(URI.create(request.getRequestURI()));
    pd.setProperty("code", CODE_UNAUTHORIZED);
    pd.setProperty("timestamp", Instant.now().toString());
    return pd;
  }
}
