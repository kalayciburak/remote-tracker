package com.team.remotetracker.schedule.dto;

import com.team.remotetracker.schedule.entity.DayStatus;
import java.time.LocalDate;

public record DayStatusResponse(LocalDate date, DayStatus status, String holidayName) {}
