package com.team.remotetracker.user;

import com.team.remotetracker.user.entity.UserGroupHistory;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserGroupHistoryRepository extends JpaRepository<UserGroupHistory, UUID> {

  boolean existsByUserId(UUID userId);

  Optional<UserGroupHistory> findByUserIdAndEffectiveFrom(UUID userId, LocalDate effectiveFrom);

  Optional<UserGroupHistory> findTopByUserIdAndEffectiveFromLessThanEqualOrderByEffectiveFromDesc(
      UUID userId, LocalDate date);

  List<UserGroupHistory>
      findAllByUserIdInAndEffectiveFromLessThanEqualOrderByUserIdAscEffectiveFromDesc(
          Collection<UUID> userIds, LocalDate date);
}
