package com.team.remotetracker.user.dto;

import com.team.remotetracker.user.entity.Role;
import com.team.remotetracker.user.entity.TeamGroup;
import jakarta.validation.constraints.Size;

public record UpdateUserRequest(
    @Size(min = 1, max = 150) String fullName, Role role, TeamGroup teamGroup, Boolean active) {}
