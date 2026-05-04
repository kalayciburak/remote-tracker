package com.team.remotetracker.schedule.dto;

import com.team.remotetracker.schedule.entity.DayCode;
import com.team.remotetracker.user.dto.UserSummary;
import com.team.remotetracker.user.entity.Department;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record ScheduleResponse(
    UUID id,
    Department department,
    LocalDate weekStartDate,
    DayCode monday,
    DayCode tuesday,
    DayCode wednesday,
    DayCode thursday,
    DayCode friday,
    String note,
    Instant createdAt,
    Instant updatedAt,
    UserSummary createdBy) {}
