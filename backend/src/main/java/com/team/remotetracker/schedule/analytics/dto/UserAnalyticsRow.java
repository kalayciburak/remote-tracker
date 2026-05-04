package com.team.remotetracker.schedule.analytics.dto;

import com.team.remotetracker.user.entity.TeamGroup;
import java.util.UUID;

public record UserAnalyticsRow(
    UUID userId,
    String username,
    String fullName,
    TeamGroup teamGroup,
    int remote,
    int office,
    int everyoneOffice,
    int holiday,
    int none,
    int totalWorkDays,
    int remotePercent) {}
