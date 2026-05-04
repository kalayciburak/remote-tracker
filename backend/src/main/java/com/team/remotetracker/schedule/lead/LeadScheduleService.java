package com.team.remotetracker.schedule.lead;

import com.team.remotetracker.schedule.lead.dto.LeadDayResponse;
import com.team.remotetracker.schedule.lead.dto.LeadTemplateRequest;
import com.team.remotetracker.schedule.lead.dto.LeadTemplateResponse;
import com.team.remotetracker.schedule.lead.dto.SetLeadDayRequest;
import com.team.remotetracker.user.entity.Department;
import java.util.List;
import java.util.UUID;

public interface LeadScheduleService {

  List<LeadTemplateResponse> listTemplates(Department department);

  LeadTemplateResponse getTemplate(UUID leadUserId);

  LeadTemplateResponse upsertTemplate(UUID actorId, UUID leadUserId, LeadTemplateRequest request);

  LeadDayResponse setDay(UUID actorId, SetLeadDayRequest request);

  List<LeadDayResponse> findMonth(int year, int month, Department department);
}
