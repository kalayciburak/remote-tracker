package com.team.remotetracker.user;

import com.team.remotetracker.user.dto.CreateUserRequest;
import com.team.remotetracker.user.dto.CreateUserResponse;
import com.team.remotetracker.user.dto.UpdateGroupRequest;
import com.team.remotetracker.user.dto.UpdateProfileRequest;
import com.team.remotetracker.user.dto.UpdateUserRequest;
import com.team.remotetracker.user.dto.UserResponse;
import com.team.remotetracker.user.entity.Department;
import com.team.remotetracker.user.entity.Role;
import com.team.remotetracker.user.entity.TeamGroup;
import com.team.remotetracker.user.entity.User;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface UserService {

  User getEntityById(UUID id);

  User getEntityByUsername(String username);

  UserResponse getById(UUID id);

  List<UserResponse> list(
      Department department,
      TeamGroup group,
      Role role,
      Boolean active,
      Boolean firstLogin,
      String search,
      LocalDate asOf);

  TeamGroup teamGroupAt(User user, LocalDate date);

  Map<UUID, TeamGroup> teamGroupsAt(List<User> users, LocalDate date);

  CreateUserResponse createByAdmin(UUID actorId, CreateUserRequest request);

  UserResponse update(UUID actorId, UUID targetId, UpdateUserRequest request);

  UserResponse updateMyProfile(UUID userId, UpdateProfileRequest request);

  UserResponse updateGroup(UUID actorId, UUID targetId, UpdateGroupRequest request);

  CreateUserResponse resetPassword(UUID actorId, UUID targetId);

  void softDelete(UUID actorId, UUID targetId);

  void changePassword(UUID userId, String currentPassword, String newPassword);

  boolean matchesPassword(User user, String rawPassword);
}
