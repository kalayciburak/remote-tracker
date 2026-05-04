package com.team.remotetracker.user.dto;

import com.team.remotetracker.user.entity.TeamGroup;
import jakarta.validation.constraints.NotNull;

public record UpdateGroupRequest(@NotNull(message = "Grup zorunlu") TeamGroup teamGroup) {}
