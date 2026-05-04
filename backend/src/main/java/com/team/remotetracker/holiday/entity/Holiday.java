package com.team.remotetracker.holiday.entity;

import com.team.remotetracker.common.audit.Auditable;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;

@Entity
@Table(name = "holidays")
public class Holiday extends Auditable {

  @Id
  @Column(nullable = false, updatable = false)
  private LocalDate date;

  @Column(nullable = false, length = 200)
  private String name;

  @Column(nullable = false)
  private int year;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 10)
  private HolidaySource source = HolidaySource.AUTO;

  @Column(name = "is_half_day")
  private Boolean isHalfDay;

  public Holiday() {}

  public Holiday(LocalDate date, String name, HolidaySource source) {
    this.date = date;
    this.name = name;
    this.year = date.getYear();
    this.source = source;
    this.isHalfDay = false;
  }

  public Holiday(LocalDate date, String name, HolidaySource source, boolean isHalfDay) {
    this(date, name, source);
    this.isHalfDay = isHalfDay;
  }

  public LocalDate getDate() {
    return date;
  }

  public void setDate(LocalDate date) {
    this.date = date;
    this.year = date == null ? 0 : date.getYear();
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public int getYear() {
    return year;
  }

  public void setYear(int year) {
    this.year = year;
  }

  public HolidaySource getSource() {
    return source;
  }

  public void setSource(HolidaySource source) {
    this.source = source;
  }

  public boolean isHalfDay() {
    return isHalfDay != null && isHalfDay;
  }

  public void setHalfDay(boolean halfDay) {
    this.isHalfDay = halfDay;
  }
}
