package com.team.remotetracker.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(Security security, Seed seed) {
  public record Security(
      String jwtSecret, int jwtTtlHours, String corsOrigins, String bootstrapUsername) {}

  public record Seed(String initialUserPassword) {}
}
