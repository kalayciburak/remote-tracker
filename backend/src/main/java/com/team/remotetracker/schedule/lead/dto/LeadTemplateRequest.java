package com.team.remotetracker.schedule.lead.dto;

import com.team.remotetracker.schedule.entity.LeadStatus;
import jakarta.validation.constraints.NotNull;

public record LeadTemplateRequest(
    @NotNull LeadStatus monday,
    @NotNull LeadStatus tuesday,
    @NotNull LeadStatus wednesday,
    @NotNull LeadStatus thursday,
    @NotNull LeadStatus friday) {}
