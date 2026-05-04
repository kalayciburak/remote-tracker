package com.team.remotetracker.schedule.mapper;

import com.team.remotetracker.schedule.dto.ScheduleResponse;
import com.team.remotetracker.schedule.entity.WeeklySchedule;
import com.team.remotetracker.user.dto.UserSummary;
import com.team.remotetracker.user.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

@Mapper(componentModel = "spring")
public interface ScheduleMapper {

  @Mapping(source = "createdBy", target = "createdBy", qualifiedByName = "userToSummary")
  ScheduleResponse toResponse(WeeklySchedule schedule);

  @Named("userToSummary")
  default UserSummary userToSummary(User user) {
    return user == null ? null : new UserSummary(user.getId(), user.getFullName());
  }
}
