package com.team.remotetracker.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
    @NotBlank(message = "Kullanıcı adı zorunlu") String username,
    @NotBlank(message = "Parola zorunlu") String password) {}
