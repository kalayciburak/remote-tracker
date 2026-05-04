package com.team.remotetracker.schedule.analytics.dto;

public record AnalyticsSummary(
    int totalWorkDays,
    int remoteSum,
    int officeSum,
    int everyoneOfficeSum,
    int noneSum,
    int holidaySum,
    GroupAnalytics groupA,
    GroupAnalytics groupB) {}
