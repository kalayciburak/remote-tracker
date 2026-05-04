package com.team.remotetracker.user.entity;

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
    name = "user_group_history",
    uniqueConstraints = {
      @UniqueConstraint(
          name = "uk_user_group_history_user_date",
          columnNames = {"user_id", "effective_from"})
    },
    indexes = {
      @Index(name = "idx_user_group_history_lookup", columnList = "user_id,effective_from")
    })
public class UserGroupHistory extends Auditable {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  @Column(nullable = false, updatable = false)
  private UUID id;

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Enumerated(EnumType.STRING)
  @Column(name = "team_group", length = 10)
  private TeamGroup teamGroup;

  @Column(name = "effective_from", nullable = false)
  private LocalDate effectiveFrom;

  public UUID getId() {
    return id;
  }

  public void setId(UUID id) {
    this.id = id;
  }

  public UUID getUserId() {
    return userId;
  }

  public void setUserId(UUID userId) {
    this.userId = userId;
  }

  public TeamGroup getTeamGroup() {
    return teamGroup;
  }

  public void setTeamGroup(TeamGroup teamGroup) {
    this.teamGroup = teamGroup;
  }

  public LocalDate getEffectiveFrom() {
    return effectiveFrom;
  }

  public void setEffectiveFrom(LocalDate effectiveFrom) {
    this.effectiveFrom = effectiveFrom;
  }
}
