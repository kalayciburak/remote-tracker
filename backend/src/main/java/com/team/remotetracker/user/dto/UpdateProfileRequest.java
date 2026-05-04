package com.team.remotetracker.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(@NotBlank @Size(min = 2, max = 150) String fullName) {}
