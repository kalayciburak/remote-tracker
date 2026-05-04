package com.team.remotetracker.schedule;

import com.team.remotetracker.schedule.dto.DayStatusResponse;
import com.team.remotetracker.schedule.dto.ScheduleResponse;
import com.team.remotetracker.schedule.dto.SetDayRequest;
import com.team.remotetracker.user.entity.Department;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface ScheduleService {

  List<ScheduleResponse> findMonth(int year, int month, Department department);

  List<DayStatusResponse> findMyMonth(UUID userId, int year, int month);

  ScheduleResponse setDay(UUID actorId, SetDayRequest request);

  ScheduleResponse setNote(
      UUID actorId, Department department, LocalDate weekStartDate, String note);
}
