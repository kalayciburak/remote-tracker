package com.team.remotetracker.schedule.lead.dto;

import com.team.remotetracker.schedule.entity.LeadStatus;
import com.team.remotetracker.user.dto.UserSummary;
import java.time.LocalDate;

public record LeadDayResponse(UserSummary lead, LocalDate date, LeadStatus status) {}
