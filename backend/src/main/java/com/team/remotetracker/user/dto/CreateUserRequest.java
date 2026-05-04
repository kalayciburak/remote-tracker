package com.team.remotetracker.user.dto;

import com.team.remotetracker.common.validation.StrongPassword;
import com.team.remotetracker.user.entity.Role;
import com.team.remotetracker.user.entity.TeamGroup;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateUserRequest(
    @NotBlank(message = "Kullanıcı adı zorunlu")
        @Size(min = 3, max = 50, message = "Kullanıcı adı 3-50 karakter olmalı")
        @Pattern(
            regexp = "^[a-z0-9_]+$",
            message = "Kullanıcı adı sadece küçük harf, rakam ve _ içerebilir")
        String username,
    @NotBlank(message = "Ad Soyad zorunlu") @Size(max = 150) String fullName,
    @NotNull(message = "Rol zorunlu") Role role,
    TeamGroup teamGroup,
    @StrongPassword String temporaryPassword) {}
