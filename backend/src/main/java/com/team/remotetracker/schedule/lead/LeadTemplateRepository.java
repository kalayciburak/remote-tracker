package com.team.remotetracker.schedule.lead;

import com.team.remotetracker.schedule.entity.LeadScheduleTemplate;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LeadTemplateRepository extends JpaRepository<LeadScheduleTemplate, UUID> {}
