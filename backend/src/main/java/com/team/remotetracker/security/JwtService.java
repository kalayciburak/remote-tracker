package com.team.remotetracker.security;

import com.team.remotetracker.common.exception.UnauthorizedException;
import com.team.remotetracker.config.AppProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
  private static final int MIN_SECRET_BYTES = 32;
  private static final String CLAIM_USERNAME = "username";
  private static final String CLAIM_ROLE = "role";

  private final SecretKey key;
  private final int ttlHours;

  public JwtService(AppProperties properties) {
    this.key = buildSecretKey(properties.security().jwtSecret());
    this.ttlHours = properties.security().jwtTtlHours();
  }

  public IssuedToken issue(UUID userId, String username, String role) {
    var now = Instant.now();
    var expiresAt = now.plus(ttlHours, ChronoUnit.HOURS);
    var token =
        Jwts.builder()
            .subject(userId.toString())
            .claim(CLAIM_USERNAME, username)
            .claim(CLAIM_ROLE, role)
            .issuedAt(Date.from(now))
            .expiration(Date.from(expiresAt))
            .signWith(key)
            .compact();
    return new IssuedToken(token, expiresAt);
  }

  public CustomUserPrincipal parsePrincipal(String token) {
    try {
      return toPrincipal(parseClaims(token));
    } catch (JwtException | IllegalArgumentException ex) {
      throw new UnauthorizedException("Geçersiz veya süresi dolmuş token");
    }
  }

  private Claims parseClaims(String token) {
    return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
  }

  private static CustomUserPrincipal toPrincipal(Claims claims) {
    var userId = UUID.fromString(claims.getSubject());
    var username = claims.get(CLAIM_USERNAME, String.class);
    var role = claims.get(CLAIM_ROLE, String.class);
    return new CustomUserPrincipal(userId, username, role);
  }

  private static SecretKey buildSecretKey(String secret) {
    var secretBytes = secret.getBytes(StandardCharsets.UTF_8);
    if (secretBytes.length < MIN_SECRET_BYTES) {
      throw new IllegalStateException(
          "app.security.jwt-secret must be at least " + MIN_SECRET_BYTES + " bytes");
    }
    return Keys.hmacShaKeyFor(secretBytes);
  }

  public record IssuedToken(String accessToken, Instant expiresAt) {}
}
