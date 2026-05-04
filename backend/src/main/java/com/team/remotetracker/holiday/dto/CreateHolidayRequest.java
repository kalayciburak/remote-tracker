package com.team.remotetracker.holiday.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record CreateHolidayRequest(
    @NotNull LocalDate date, @NotBlank @Size(max = 200) String name, Boolean isHalfDay) {

  public boolean isHalfDayOrFalse() {
    return isHalfDay != null && isHalfDay;
  }
}
