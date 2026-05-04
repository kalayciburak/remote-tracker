package com.team.remotetracker.schedule.analytics;

import com.team.remotetracker.schedule.analytics.dto.MonthAnalyticsResponse;
import com.team.remotetracker.user.entity.Department;
import java.util.UUID;

public interface AnalyticsService {

  MonthAnalyticsResponse monthAnalytics(UUID actorId, int year, int month, Department requested);
}
