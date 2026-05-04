package com.team.remotetracker.user;

import com.team.remotetracker.common.exception.ForbiddenException;
import com.team.remotetracker.user.dto.ShuffleProposal;
import com.team.remotetracker.user.dto.ShuffleResponse;
import com.team.remotetracker.user.entity.Department;
import com.team.remotetracker.user.entity.Role;
import com.team.remotetracker.user.entity.TeamGroup;
import com.team.remotetracker.user.entity.User;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class TeamShuffleService {

  private static final int SHUFFLE_ATTEMPTS = 20;
  private static final double MIN_CHANGE_RATIO = 0.5;

  private final UserRepository userRepository;
  private final Random random = new Random();

  public TeamShuffleService(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  public void requireCanShuffle(User actor, Department department) {
    if (actor.getRole().isSuperAdmin()) return;
    if (!actor.getRole().isTeamLead()) {
      throw new ForbiddenException("Yetkiniz yok");
    }
    if (actor.getRole().department() != department) {
      throw new ForbiddenException("Başka departmanın grubunu shuffle edemezsiniz");
    }
  }

  public ShuffleResponse proposeShuffle(Department department) {
    var rolesInDept =
        switch (department) {
          case DEV -> List.of(Role.DEV);
          case TEST -> List.of(Role.TEST);
        };
    var users = userRepository.findAllByActiveTrueAndRoleIn(rolesInDept);
    if (users.isEmpty()) return new ShuffleResponse(List.of());

    Map<UUID, TeamGroup> bestAssignment = null;
    int bestChangeCount = -1;
    int targetMinChange = Math.max(1, (int) Math.ceil(users.size() * MIN_CHANGE_RATIO));

    for (int attempt = 0; attempt < SHUFFLE_ATTEMPTS; attempt++) {
      var attemptAssignment = randomAssignment(users);
      int changes = countChanges(users, attemptAssignment);
      if (changes >= targetMinChange) {
        bestAssignment = attemptAssignment;
        break;
      }
      if (changes > bestChangeCount) {
        bestChangeCount = changes;
        bestAssignment = attemptAssignment;
      }
    }

    var proposals = new ArrayList<ShuffleProposal>();
    for (var u : users) {
      var suggested = bestAssignment.get(u.getId());
      proposals.add(new ShuffleProposal(u.getId(), u.getFullName(), u.getTeamGroup(), suggested));
    }
    return new ShuffleResponse(proposals);
  }

  private Map<UUID, TeamGroup> randomAssignment(List<User> users) {
    var pool = new ArrayList<>(users);
    Collections.shuffle(pool, random);

    int total = users.size();
    int targetA = total / 2;

    var assignment = new HashMap<UUID, TeamGroup>();
    for (int i = 0; i < pool.size(); i++) {
      assignment.put(pool.get(i).getId(), i < targetA ? TeamGroup.A : TeamGroup.B);
    }
    return assignment;
  }

  private static int countChanges(List<User> users, Map<UUID, TeamGroup> assignment) {
    int changes = 0;
    for (var u : users) {
      if (u.getTeamGroup() != assignment.get(u.getId())) changes++;
    }
    return changes;
  }
}
