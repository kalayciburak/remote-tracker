package com.team.remotetracker.schedule.lead.dto;

import com.team.remotetracker.schedule.entity.LeadStatus;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.UUID;

public record SetLeadDayRequest(
    @NotNull(message = "Lead zorunlu") UUID leadUserId,
    @NotNull(message = "Tarih zorunlu") LocalDate date,
    @NotNull(message = "Durum zorunlu") LeadStatus status) {}
