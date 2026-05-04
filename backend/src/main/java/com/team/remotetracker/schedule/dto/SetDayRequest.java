package com.team.remotetracker.schedule.dto;

import com.team.remotetracker.schedule.entity.DayCode;
import com.team.remotetracker.user.entity.Department;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record SetDayRequest(
    @NotNull(message = "Departman zorunlu") Department department,
    @NotNull(message = "Tarih zorunlu") LocalDate date,
    @NotNull(message = "Kod zorunlu") DayCode code) {}
