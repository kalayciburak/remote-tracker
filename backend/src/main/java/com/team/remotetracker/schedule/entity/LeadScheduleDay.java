package com.team.remotetracker.schedule.entity;

import com.team.remotetracker.common.audit.Auditable;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(
    name = "lead_schedule_days",
    uniqueConstraints =
        @UniqueConstraint(
            name = "uk_lead_schedule_days_lead_date",
            columnNames = {"lead_user_id", "schedule_date"}),
    indexes =
        @Index(
            name = "idx_lead_schedule_days_lead_date",
            columnList = "lead_user_id,schedule_date"))
public class LeadScheduleDay extends Auditable {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  @Column(nullable = false, updatable = false)
  private UUID id;

  @Column(name = "lead_user_id", nullable = false)
  private UUID leadUserId;

  @Column(name = "schedule_date", nullable = false)
  private LocalDate date;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 10)
  private LeadStatus status;

  public UUID getId() {
    return id;
  }

  public void setId(UUID id) {
    this.id = id;
  }

  public UUID getLeadUserId() {
    return leadUserId;
  }

  public void setLeadUserId(UUID leadUserId) {
    this.leadUserId = leadUserId;
  }

  public LocalDate getDate() {
    return date;
  }

  public void setDate(LocalDate date) {
    this.date = date;
  }

  public LeadStatus getStatus() {
    return status;
  }

  public void setStatus(LeadStatus status) {
    this.status = status;
  }
}
