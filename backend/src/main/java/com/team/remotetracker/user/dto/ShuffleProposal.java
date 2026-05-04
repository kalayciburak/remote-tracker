package com.team.remotetracker.user.dto;

import com.team.remotetracker.user.entity.TeamGroup;
import java.util.UUID;

public record ShuffleProposal(
    UUID userId, String fullName, TeamGroup currentGroup, TeamGroup suggestedGroup) {}
