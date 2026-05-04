package com.team.remotetracker.user.mapper;

import com.team.remotetracker.user.dto.UserResponse;
import com.team.remotetracker.user.dto.UserSummary;
import com.team.remotetracker.user.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

@Mapper(componentModel = "spring")
public interface UserMapper {

  @Mapping(target = "department", source = "role", qualifiedByName = "roleToDepartment")
  UserResponse toResponse(User user);

  UserSummary toSummary(User user);

  @Named("roleToDepartment")
  default com.team.remotetracker.user.entity.Department roleToDepartment(
      com.team.remotetracker.user.entity.Role role) {
    return role == null ? null : role.department();
  }
}
