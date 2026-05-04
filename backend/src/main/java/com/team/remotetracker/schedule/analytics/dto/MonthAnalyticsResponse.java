package com.team.remotetracker.schedule.analytics.dto;

import com.team.remotetracker.user.entity.Department;
import java.util.List;

public record MonthAnalyticsResponse(
    int year,
    int month,
    Department department,
    AnalyticsSummary summary,
    List<UserAnalyticsRow> rows) {}
