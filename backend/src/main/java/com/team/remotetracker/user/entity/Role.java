package com.team.remotetracker.user.entity;

public enum Role {
  SUPER_ADMIN,
  TEAM_LEAD_DEV,
  TEAM_LEAD_TEST,
  DEV,
  TEST;

  public Department department() {
    return switch (this) {
      case TEAM_LEAD_DEV, DEV -> Department.DEV;
      case TEAM_LEAD_TEST, TEST -> Department.TEST;
      case SUPER_ADMIN -> null;
    };
  }

  public boolean isSuperAdmin() {
    return this == SUPER_ADMIN;
  }

  public boolean isTeamLead() {
    return this == TEAM_LEAD_DEV || this == TEAM_LEAD_TEST;
  }

  public boolean canManageDepartment(Department dept) {
    if (this == SUPER_ADMIN) return true;
    if (dept == null) return false;
    return department() == dept;
  }

  public String turkishLabel() {
    return switch (this) {
      case SUPER_ADMIN -> "Proje Yöneticisi";
      case TEAM_LEAD_DEV -> "Geliştirici/Analiz Lideri";
      case TEAM_LEAD_TEST -> "Test/Raporlama Lideri";
      case DEV -> "Geliştirici/Analiz";
      case TEST -> "Test/Raporlama";
    };
  }
}
