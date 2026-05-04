package com.team.remotetracker.auth.dto;

import com.team.remotetracker.common.validation.StrongPassword;
import jakarta.validation.constraints.NotBlank;

public record ChangePasswordRequest(
    @NotBlank(message = "Mevcut parola zorunlu") String currentPassword,
    @NotBlank(message = "Yeni parola zorunlu") @StrongPassword String newPassword) {}
