package com.team.remotetracker.user.entity;

import com.team.remotetracker.common.audit.Auditable;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "users")
public class User extends Auditable {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  @Column(nullable = false, updatable = false)
  private UUID id;

  @Column(nullable = false, unique = true, length = 50)
  private String username;

  @Column(name = "full_name", nullable = false, length = 150)
  private String fullName;

  @Column(name = "password_hash", nullable = false, length = 255)
  private String passwordHash;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 30)
  private Role role;

  @Enumerated(EnumType.STRING)
  @Column(name = "team_group", length = 10)
  private TeamGroup teamGroup;

  @Column(name = "first_login", nullable = false)
  private boolean firstLogin = true;

  @Column(nullable = false)
  private boolean active = true;

  public UUID getId() {
    return id;
  }

  public void setId(UUID id) {
    this.id = id;
  }

  public String getUsername() {
    return username;
  }

  public void setUsername(String username) {
    this.username = username;
  }

  public String getFullName() {
    return fullName;
  }

  public void setFullName(String fullName) {
    this.fullName = fullName;
  }

  public String getPasswordHash() {
    return passwordHash;
  }

  public void setPasswordHash(String passwordHash) {
    this.passwordHash = passwordHash;
  }

  public Role getRole() {
    return role;
  }

  public void setRole(Role role) {
    this.role = role;
  }

  public TeamGroup getTeamGroup() {
    return teamGroup;
  }

  public void setTeamGroup(TeamGroup teamGroup) {
    this.teamGroup = teamGroup;
  }

  public boolean isFirstLogin() {
    return firstLogin;
  }

  public void setFirstLogin(boolean firstLogin) {
    this.firstLogin = firstLogin;
  }

  public boolean isActive() {
    return active;
  }

  public void setActive(boolean active) {
    this.active = active;
  }

  public Department getDepartment() {
    return role == null ? null : role.department();
  }
}
