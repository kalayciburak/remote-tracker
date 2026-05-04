package com.team.remotetracker.holiday.dto;

import com.team.remotetracker.holiday.entity.HolidaySource;
import java.time.LocalDate;

public record HolidayResponse(
    LocalDate date, String name, HolidaySource source, boolean isHalfDay) {}
