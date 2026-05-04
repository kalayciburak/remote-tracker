package com.team.remotetracker.schedule.lead;

import com.team.remotetracker.schedule.entity.LeadScheduleDay;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LeadScheduleDayRepository extends JpaRepository<LeadScheduleDay, UUID> {

  Optional<LeadScheduleDay> findByLeadUserIdAndDate(UUID leadUserId, LocalDate date);

  List<LeadScheduleDay> findAllByLeadUserIdAndDateBetween(
      UUID leadUserId, LocalDate from, LocalDate to);

  List<LeadScheduleDay> findAllByLeadUserIdInAndDateBetween(
      Collection<UUID> leadUserIds, LocalDate from, LocalDate to);
}
