package com.team.remotetracker.schedule;

import com.team.remotetracker.schedule.entity.WeeklySchedule;
import com.team.remotetracker.user.entity.Department;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScheduleRepository extends JpaRepository<WeeklySchedule, UUID> {

  Optional<WeeklySchedule> findByDepartmentAndWeekStartDate(
      Department department, LocalDate weekStartDate);

  List<WeeklySchedule> findAllByDepartmentAndWeekStartDateBetweenOrderByWeekStartDateAsc(
      Department department, LocalDate from, LocalDate to);

  List<WeeklySchedule> findAllByWeekStartDateBetweenOrderByWeekStartDateAsc(
      LocalDate from, LocalDate to);
}
