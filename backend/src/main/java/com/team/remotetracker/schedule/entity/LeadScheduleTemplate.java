package com.team.remotetracker.schedule.entity;

import com.team.remotetracker.common.audit.Auditable;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "lead_schedule_templates")
public class LeadScheduleTemplate extends Auditable {

  @Id
  @Column(name = "lead_user_id", nullable = false, updatable = false)
  private UUID leadUserId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 10)
  private LeadStatus monday = LeadStatus.OFFICE;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 10)
  private LeadStatus tuesday = LeadStatus.OFFICE;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 10)
  private LeadStatus wednesday = LeadStatus.OFFICE;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 10)
  private LeadStatus thursday = LeadStatus.OFFICE;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 10)
  private LeadStatus friday = LeadStatus.OFFICE;

  public UUID getLeadUserId() {
    return leadUserId;
  }

  public void setLeadUserId(UUID leadUserId) {
    this.leadUserId = leadUserId;
  }

  public LeadStatus getMonday() {
    return monday;
  }

  public void setMonday(LeadStatus monday) {
    this.monday = monday;
  }

  public LeadStatus getTuesday() {
    return tuesday;
  }

  public void setTuesday(LeadStatus tuesday) {
    this.tuesday = tuesday;
  }

  public LeadStatus getWednesday() {
    return wednesday;
  }

  public void setWednesday(LeadStatus wednesday) {
    this.wednesday = wednesday;
  }

  public LeadStatus getThursday() {
    return thursday;
  }

  public void setThursday(LeadStatus thursday) {
    this.thursday = thursday;
  }

  public LeadStatus getFriday() {
    return friday;
  }

  public void setFriday(LeadStatus friday) {
    this.friday = friday;
  }

  public LeadStatus statusForDow(java.time.DayOfWeek dow) {
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
