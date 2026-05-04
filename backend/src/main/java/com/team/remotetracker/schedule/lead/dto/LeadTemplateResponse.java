package com.team.remotetracker.schedule.lead.dto;

import com.team.remotetracker.schedule.entity.LeadStatus;
import com.team.remotetracker.user.dto.UserSummary;

public record LeadTemplateResponse(
    UserSummary lead,
    LeadStatus monday,
    LeadStatus tuesday,
    LeadStatus wednesday,
    LeadStatus thursday,
    LeadStatus friday) {}
