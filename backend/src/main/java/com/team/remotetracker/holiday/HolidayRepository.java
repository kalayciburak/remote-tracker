package com.team.remotetracker.holiday;

import com.team.remotetracker.holiday.entity.Holiday;
import com.team.remotetracker.holiday.entity.HolidaySource;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HolidayRepository extends JpaRepository<Holiday, LocalDate> {

  List<Holiday> findAllByYearOrderByDateAsc(int year);

  boolean existsByYearAndSource(int year, HolidaySource source);
}
