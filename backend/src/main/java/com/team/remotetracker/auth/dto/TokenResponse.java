package com.team.remotetracker.auth.dto;

import com.team.remotetracker.user.dto.UserResponse;
import java.time.Instant;

public record TokenResponse(String token, Instant expiresAt, UserResponse user) {}
