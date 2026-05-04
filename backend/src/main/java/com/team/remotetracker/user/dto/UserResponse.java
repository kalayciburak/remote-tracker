package com.team.remotetracker.user.dto;

import com.team.remotetracker.user.entity.Department;
import com.team.remotetracker.user.entity.Role;
import com.team.remotetracker.user.entity.TeamGroup;
import java.time.Instant;
import java.util.UUID;

public record UserResponse(
    UUID id,
    String username,
    String fullName,
    Role role,
    Department department,
    TeamGroup teamGroup,
    boolean firstLogin,
    boolean active,
    Instant createdAt,
    Instant updatedAt) {}
