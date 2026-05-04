package com.team.remotetracker.user.entity;

public enum Department {
  DEV,
  TEST;

  public String displayName() {
    return this == DEV ? "Geliştirici/Analiz" : "Test/Raporlama";
  }
}
