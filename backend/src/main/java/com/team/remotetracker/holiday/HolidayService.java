package com.team.remotetracker.holiday;

import com.team.remotetracker.common.exception.ConflictException;
import com.team.remotetracker.common.exception.NotFoundException;
import com.team.remotetracker.holiday.dto.CreateHolidayRequest;
import com.team.remotetracker.holiday.dto.HolidayResponse;
import com.team.remotetracker.holiday.entity.Holiday;
import com.team.remotetracker.holiday.entity.HolidaySource;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class HolidayService {

  private final HolidayRepository repository;

  public HolidayService(HolidayRepository repository) {
    this.repository = repository;
  }

  public List<HolidayResponse> getHolidays(int year) {
    return repository.findAllByYearOrderByDateAsc(year).stream()
        .map(h -> new HolidayResponse(h.getDate(), h.getName(), h.getSource(), h.isHalfDay()))
        .toList();
  }

  public Map<LocalDate, String> getHolidayMap(int year) {
    var map = new LinkedHashMap<LocalDate, String>();
    for (var h : repository.findAllByYearOrderByDateAsc(year)) map.put(h.getDate(), h.getName());
    return map;
  }

  public Set<LocalDate> getHalfDayHolidays(int year) {
    var set = new HashSet<LocalDate>();
    for (var h : repository.findAllByYearOrderByDateAsc(year)) {
      if (h.isHalfDay()) set.add(h.getDate());
    }
    return set;
  }

  public boolean hasAutoData(int year) {
    return repository.existsByYearAndSource(year, HolidaySource.AUTO);
  }

  @Transactional
  public HolidayResponse addManual(CreateHolidayRequest request) {
    if (repository.existsById(request.date())) {
      throw new ConflictException("HOLIDAY_EXISTS", "Bu tarihte zaten bir tatil tanımlı");
    }
    var holiday =
        new Holiday(
            request.date(), request.name(), HolidaySource.MANUAL, request.isHalfDayOrFalse());
    var saved = repository.save(holiday);
    return new HolidayResponse(
        saved.getDate(), saved.getName(), saved.getSource(), saved.isHalfDay());
  }

  @Transactional
  public void delete(LocalDate date) {
    var holiday =
        repository.findById(date).orElseThrow(() -> new NotFoundException("Tatil bulunamadı"));
    repository.delete(holiday);
  }

  @Transactional
  public HolidayResponse setHalfDay(LocalDate date, boolean isHalfDay) {
    var holiday =
        repository.findById(date).orElseThrow(() -> new NotFoundException("Tatil bulunamadı"));
    holiday.setHalfDay(isHalfDay);
    return new HolidayResponse(
        holiday.getDate(), holiday.getName(), holiday.getSource(), holiday.isHalfDay());
  }

  @Transactional
  public int upsertAll(List<Holiday> holidays) {
    int written = 0;
    for (var incoming : holidays) {
      var existing = repository.findById(incoming.getDate()).orElse(null);
      if (existing == null) {
        repository.save(incoming);
        written++;
        continue;
      }
      if (existing.getSource() == HolidaySource.MANUAL) continue;
      existing.setName(incoming.getName());
      existing.setSource(incoming.getSource());
      existing.setHalfDay(incoming.isHalfDay());
      written++;
    }
    return written;
  }
}
