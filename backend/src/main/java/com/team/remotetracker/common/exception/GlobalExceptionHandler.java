package com.team.remotetracker.common.exception;

import jakarta.servlet.http.HttpServletRequest;
import java.net.URI;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;

@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(BaseApiException.class)
  public ResponseEntity<ProblemDetail> handleApi(BaseApiException ex, HttpServletRequest req) {
    ProblemDetail pd = build(ex.getStatus(), ex.getCode(), ex.getMessage(), req);
    return ResponseEntity.status(ex.getStatus()).body(pd);
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ProblemDetail> handleValidation(
      MethodArgumentNotValidException ex, HttpServletRequest req) {
    List<Map<String, String>> fields =
        ex.getBindingResult().getFieldErrors().stream()
            .map(
                fe ->
                    Map.of(
                        "field",
                        fe.getField(),
                        "message",
                        fe.getDefaultMessage() == null ? "Geçersiz değer" : fe.getDefaultMessage()))
            .toList();
    ProblemDetail pd = build(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", "Girdiler geçersiz", req);
    pd.setProperty("fields", fields);
    return ResponseEntity.badRequest().body(pd);
  }

  @ExceptionHandler(HandlerMethodValidationException.class)
  public ResponseEntity<ProblemDetail> handleHandlerValidation(
      HandlerMethodValidationException ex, HttpServletRequest req) {
    ProblemDetail pd = build(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", "Girdiler geçersiz", req);
    return ResponseEntity.badRequest().body(pd);
  }

  @ExceptionHandler(HttpMessageNotReadableException.class)
  public ResponseEntity<ProblemDetail> handleBodyRead(
      HttpMessageNotReadableException ex, HttpServletRequest req) {
    ProblemDetail pd =
        build(HttpStatus.BAD_REQUEST, "MALFORMED_JSON", "İstek gövdesi okunamadı", req);
    return ResponseEntity.badRequest().body(pd);
  }

  @ExceptionHandler(AccessDeniedException.class)
  public ResponseEntity<ProblemDetail> handleAccessDenied(
      AccessDeniedException ex, HttpServletRequest req) {
    ProblemDetail pd = build(HttpStatus.FORBIDDEN, "FORBIDDEN", "Yetkisiz erişim", req);
    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(pd);
  }

  @ExceptionHandler({AuthenticationException.class, BadCredentialsException.class})
  public ResponseEntity<ProblemDetail> handleAuth(Exception ex, HttpServletRequest req) {
    ProblemDetail pd = build(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Kimlik doğrulanamadı", req);
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(pd);
  }

  @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
  public ResponseEntity<ProblemDetail> handleOptimistic(
      ObjectOptimisticLockingFailureException ex, HttpServletRequest req) {
    ProblemDetail pd =
        build(
            HttpStatus.CONFLICT,
            "CONCURRENT_MODIFICATION",
            "Bu kayıt başka bir oturumda güncellendi, lütfen yenileyin",
            req);
    return ResponseEntity.status(HttpStatus.CONFLICT).body(pd);
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ProblemDetail> handleFallback(Exception ex, HttpServletRequest req) {
    ProblemDetail pd =
        build(
            HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "Beklenmeyen bir hata oluştu", req);
    pd.setProperty("exception", ex.getClass().getSimpleName());
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(pd);
  }

  private ProblemDetail build(
      HttpStatus status, String code, String detail, HttpServletRequest req) {
    ProblemDetail pd = ProblemDetail.forStatusAndDetail(status, detail);
    pd.setTitle(status.getReasonPhrase());
    pd.setType(URI.create("urn:remote-tracker:" + code.toLowerCase().replace('_', '-')));
    pd.setInstance(URI.create(req.getRequestURI()));
    pd.setProperty("code", code);
    pd.setProperty("timestamp", Instant.now().toString());
    return pd;
  }
}
