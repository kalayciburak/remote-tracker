package com.team.remotetracker.schedule.entity;

import com.team.remotetracker.common.audit.Auditable;
import com.team.remotetracker.user.entity.Department;
import com.team.remotetracker.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(
    name = "weekly_schedules",
    uniqueConstraints =
        @UniqueConstraint(
            name = "uk_weekly_schedule_dept_week",
            columnNames = {"department", "week_start_date"}))
public class WeeklySchedule extends Auditable {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  @Column(nullable = false, updatable = false)
  private UUID id;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 10)
  private Department department;

  @Column(name = "week_start_date", nullable = false)
  private LocalDate weekStartDate;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 10)
  private DayCode monday = DayCode.NONE;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 10)
  private DayCode tuesday = DayCode.NONE;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 10)
  private DayCode wednesday = DayCode.NONE;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 10)
  private DayCode thursday = DayCode.NONE;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 10)
  private DayCode friday = DayCode.NONE;

  @Column(columnDefinition = "TEXT")
  private String note;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "created_by")
  private User createdBy;

  public UUID getId() {
    return id;
  }

  public void setId(UUID id) {
    this.id = id;
  }

  public Department getDepartment() {
    return department;
  }

  public void setDepartment(Department department) {
    this.department = department;
  }

  public LocalDate getWeekStartDate() {
    return weekStartDate;
  }

  public void setWeekStartDate(LocalDate weekStartDate) {
    this.weekStartDate = weekStartDate;
  }

  public DayCode getMonday() {
    return monday;
  }

  public void setMonday(DayCode monday) {
    this.monday = monday;
  }

  public DayCode getTuesday() {
    return tuesday;
  }

  public void setTuesday(DayCode tuesday) {
    this.tuesday = tuesday;
  }

  public DayCode getWednesday() {
    return wednesday;
  }

  public void setWednesday(DayCode wednesday) {
    this.wednesday = wednesday;
  }

  public DayCode getThursday() {
    return thursday;
  }

  public void setThursday(DayCode thursday) {
    this.thursday = thursday;
  }

  public DayCode getFriday() {
    return friday;
  }

  public void setFriday(DayCode friday) {
    this.friday = friday;
  }

  public String getNote() {
    return note;
  }

  public void setNote(String note) {
    this.note = note;
  }

  public User getCreatedBy() {
    return createdBy;
  }

  public void setCreatedBy(User createdBy) {
    this.createdBy = createdBy;
  }

  public DayCode codeForDayOfWeek(java.time.DayOfWeek dow) {
    return switch (dow) {
      case MONDAY -> monday;
      case TUESDAY -> tuesday;
      case WEDNESDAY -> wednesday;
      case THURSDAY -> thursday;
      case FRIDAY -> friday;
      default -> null;
    };
  }
}
