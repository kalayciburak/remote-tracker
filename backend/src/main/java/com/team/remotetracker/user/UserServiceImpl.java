package com.team.remotetracker.user;

import com.team.remotetracker.common.exception.BusinessRuleException;
import com.team.remotetracker.common.exception.ConflictException;
import com.team.remotetracker.common.exception.ForbiddenException;
import com.team.remotetracker.common.exception.NotFoundException;
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
import com.team.remotetracker.user.entity.UserGroupHistory;
import com.team.remotetracker.user.mapper.UserMapper;
import jakarta.persistence.criteria.Predicate;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class UserServiceImpl implements UserService {

  private static final String UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  private static final String LOWER = "abcdefghjkmnpqrstuvwxyz";
  private static final String DIGITS = "23456789";
  private static final int TEMP_PASSWORD_LENGTH = 12;
  private static final LocalDate HISTORY_FLOOR = LocalDate.of(1970, 1, 1);
  private static final ZoneId APP_ZONE = ZoneId.of("Europe/Istanbul");

  private final UserRepository repository;
  private final UserGroupHistoryRepository groupHistoryRepository;
  private final UserMapper mapper;
  private final PasswordEncoder passwordEncoder;
  private final SecureRandom random = new SecureRandom();

  public UserServiceImpl(
      UserRepository repository,
      UserGroupHistoryRepository groupHistoryRepository,
      UserMapper mapper,
      PasswordEncoder passwordEncoder) {
    this.repository = repository;
    this.groupHistoryRepository = groupHistoryRepository;
    this.mapper = mapper;
    this.passwordEncoder = passwordEncoder;
  }

  @Override
  public User getEntityById(UUID id) {
    return repository.findById(id).orElseThrow(() -> new NotFoundException("Kullanıcı bulunamadı"));
  }

  @Override
  public User getEntityByUsername(String username) {
    return repository
        .findByUsername(username)
        .orElseThrow(() -> new NotFoundException("Kullanıcı bulunamadı"));
  }

  @Override
  public UserResponse getById(UUID id) {
    return mapper.toResponse(getEntityById(id));
  }

  @Override
  public List<UserResponse> list(
      Department department,
      TeamGroup group,
      Role role,
      Boolean active,
      Boolean firstLogin,
      String search,
      LocalDate asOf) {
    var spec = buildSpec(department, asOf == null ? group : null, role, active, firstLogin, search);
    var users = repository.findAll(spec);
    if (asOf == null) {
      return users.stream().map(mapper::toResponse).toList();
    }

    var groupsAtDate = teamGroupsAt(users, asOf);
    return users.stream()
        .map(user -> toResponseWithGroup(user, groupsAtDate.get(user.getId())))
        .filter(response -> group == null || response.teamGroup() == group)
        .toList();
  }

  @Override
  @Transactional
  public CreateUserResponse createByAdmin(UUID actorId, CreateUserRequest request) {
    var actor = getEntityById(actorId);
    requireCanManageRole(actor, request.role());
    requireUsernameAvailable(request.username());
    requireGroupConsistencyWithRole(request.role(), request.teamGroup());

    String tempPassword =
        request.temporaryPassword() == null || request.temporaryPassword().isBlank()
            ? generateTempPassword()
            : request.temporaryPassword();

    var user = new User();
    user.setUsername(request.username().toLowerCase());
    user.setFullName(request.fullName().trim());
    user.setRole(request.role());
    user.setTeamGroup(needsGroup(request.role()) ? request.teamGroup() : null);
    user.setPasswordHash(passwordEncoder.encode(tempPassword));
    user.setFirstLogin(true);
    user.setActive(true);

    var saved = repository.save(user);
    recordInitialGroup(saved);
    return new CreateUserResponse(mapper.toResponse(saved), tempPassword);
  }

  @Override
  @Transactional
  public UserResponse update(UUID actorId, UUID targetId, UpdateUserRequest request) {
    var actor = getEntityById(actorId);
    var target = getEntityById(targetId);
    requireCanManageUser(actor, target);
    var oldGroup = target.getTeamGroup();

    if (request.fullName() != null) target.setFullName(request.fullName().trim());
    if (request.role() != null) {
      requireCanManageRole(actor, request.role());
      target.setRole(request.role());
      if (!needsGroup(request.role())) target.setTeamGroup(null);
    }
    if (request.teamGroup() != null && needsGroup(target.getRole())) {
      target.setTeamGroup(request.teamGroup());
    }
    if (request.active() != null) {
      if (!request.active()) requireNotLastActiveSuperAdmin(target);
      target.setActive(request.active());
    }
    recordGroupChange(target, oldGroup, target.getTeamGroup());
    return mapper.toResponse(target);
  }

  @Override
  @Transactional
  public UserResponse updateMyProfile(UUID userId, UpdateProfileRequest request) {
    var user = getEntityById(userId);
    user.setFullName(request.fullName().trim());
    return mapper.toResponse(user);
  }

  @Override
  @Transactional
  public UserResponse updateGroup(UUID actorId, UUID targetId, UpdateGroupRequest request) {
    var actor = getEntityById(actorId);
    var target = getEntityById(targetId);
    requireCanManageUser(actor, target);
    if (!needsGroup(target.getRole())) {
      throw new BusinessRuleException("ROLE_NO_GROUP", "Bu rol için grup ataması yapılamaz");
    }
    var oldGroup = target.getTeamGroup();
    target.setTeamGroup(request.teamGroup());
    recordGroupChange(target, oldGroup, request.teamGroup());
    return mapper.toResponse(target);
  }

  @Override
  public TeamGroup teamGroupAt(User user, LocalDate date) {
    if (date == null) return user.getTeamGroup();
    return groupHistoryRepository
        .findTopByUserIdAndEffectiveFromLessThanEqualOrderByEffectiveFromDesc(user.getId(), date)
        .map(UserGroupHistory::getTeamGroup)
        .orElse(user.getTeamGroup());
  }

  @Override
  public Map<UUID, TeamGroup> teamGroupsAt(List<User> users, LocalDate date) {
    var result = new HashMap<UUID, TeamGroup>();
    if (users.isEmpty()) return result;
    var ids = users.stream().map(User::getId).toList();
    groupHistoryRepository
        .findAllByUserIdInAndEffectiveFromLessThanEqualOrderByUserIdAscEffectiveFromDesc(ids, date)
        .forEach(row -> result.putIfAbsent(row.getUserId(), row.getTeamGroup()));
    users.forEach(user -> result.putIfAbsent(user.getId(), user.getTeamGroup()));
    return result;
  }

  @Override
  @Transactional
  public CreateUserResponse resetPassword(UUID actorId, UUID targetId) {
    var actor = getEntityById(actorId);
    var target = getEntityById(targetId);
    requireCanManageUser(actor, target);
    var tempPassword = generateTempPassword();
    target.setPasswordHash(passwordEncoder.encode(tempPassword));
    target.setFirstLogin(true);
    return new CreateUserResponse(mapper.toResponse(target), tempPassword);
  }

  @Override
  @Transactional
  public void softDelete(UUID actorId, UUID targetId) {
    var actor = getEntityById(actorId);
    var target = getEntityById(targetId);
    requireCanManageUser(actor, target);
    requireNotLastActiveSuperAdmin(target);
    target.setActive(false);
  }

  @Override
  @Transactional
  public void changePassword(UUID userId, String currentPassword, String newPassword) {
    var user = getEntityById(userId);
    if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
      throw new ForbiddenException("Mevcut parola hatalı");
    }
    user.setPasswordHash(passwordEncoder.encode(newPassword));
    user.setFirstLogin(false);
  }

  @Override
  public boolean matchesPassword(User user, String rawPassword) {
    return passwordEncoder.matches(rawPassword, user.getPasswordHash());
  }

  private void requireUsernameAvailable(String username) {
    if (repository.existsByUsername(username.toLowerCase())) {
      throw new ConflictException("USERNAME_TAKEN", "Bu kullanıcı adı zaten kayıtlı");
    }
  }

  private static void requireGroupConsistencyWithRole(Role role, TeamGroup group) {
    if (needsGroup(role) && group == null) {
      throw new BusinessRuleException("GROUP_REQUIRED", "Bu rol için grup zorunlu");
    }
  }

  private static boolean needsGroup(Role role) {
    return role == Role.DEV || role == Role.TEST;
  }

  private static void requireCanManageRole(User actor, Role targetRole) {
    if (actor.getRole().isSuperAdmin()) return;
    if (!actor.getRole().isTeamLead()) {
      throw new ForbiddenException("Yetkiniz yok");
    }
    if (targetRole == Role.SUPER_ADMIN) {
      throw new ForbiddenException("Sadece Proje Yöneticisi süper admin atayabilir");
    }
    if (targetRole.isTeamLead() && targetRole != actor.getRole()) {
      throw new ForbiddenException("Başka departmanın takım liderini yönetemezsiniz");
    }
    if (targetRole.department() != null
        && targetRole.department() != actor.getRole().department()) {
      throw new ForbiddenException("Başka departmanın kullanıcısını yönetemezsiniz");
    }
  }

  private static void requireCanManageUser(User actor, User target) {
    if (actor.getRole().isSuperAdmin()) return;
    if (target.getRole().isSuperAdmin()) {
      throw new ForbiddenException("Süper admini sadece kendisi düzenleyebilir");
    }
    if (target.getRole().isTeamLead() && target.getRole() != actor.getRole()) {
      throw new ForbiddenException("Başka departmanın takım liderini yönetemezsiniz");
    }
    if (target.getDepartment() != null && target.getDepartment() != actor.getDepartment()) {
      throw new ForbiddenException("Başka departmanın kullanıcısını yönetemezsiniz");
    }
  }

  private void requireNotLastActiveSuperAdmin(User user) {
    if (user.getRole() != Role.SUPER_ADMIN || !user.isActive()) return;
    long count = repository.countByRoleAndActive(Role.SUPER_ADMIN, true);
    if (count <= 1) {
      throw new BusinessRuleException(
          "LAST_SUPER_ADMIN", "Sistemdeki son aktif süper admin pasifleştirilemez");
    }
  }

  private String generateTempPassword() {
    var chars = new ArrayList<Character>(TEMP_PASSWORD_LENGTH);
    chars.add(pickRandom(UPPER));
    chars.add(pickRandom(LOWER));
    chars.add(pickRandom(DIGITS));
    var alphabet = UPPER + LOWER + DIGITS;
    while (chars.size() < TEMP_PASSWORD_LENGTH) chars.add(pickRandom(alphabet));
    Collections.shuffle(chars, random);
    var sb = new StringBuilder(TEMP_PASSWORD_LENGTH);
    for (var c : chars) sb.append(c);
    return sb.toString();
  }

  private char pickRandom(String pool) {
    return pool.charAt(random.nextInt(pool.length()));
  }

  private UserResponse toResponseWithGroup(User user, TeamGroup teamGroup) {
    return new UserResponse(
        user.getId(),
        user.getUsername(),
        user.getFullName(),
        user.getRole(),
        user.getDepartment(),
        teamGroup,
        user.isFirstLogin(),
        user.isActive(),
        user.getCreatedAt(),
        user.getUpdatedAt());
  }

  private void recordInitialGroup(User user) {
    if (user.getTeamGroup() == null) return;
    saveGroupHistory(user.getId(), HISTORY_FLOOR, user.getTeamGroup());
  }

  private void recordGroupChange(User user, TeamGroup oldGroup, TeamGroup newGroup) {
    if (Objects.equals(oldGroup, newGroup)) return;
    if (!groupHistoryRepository.existsByUserId(user.getId()) && oldGroup != null) {
      saveGroupHistory(user.getId(), HISTORY_FLOOR, oldGroup);
    }
    saveGroupHistory(user.getId(), LocalDate.now(APP_ZONE), newGroup);
  }

  private void saveGroupHistory(UUID userId, LocalDate effectiveFrom, TeamGroup teamGroup) {
    var row =
        groupHistoryRepository
            .findByUserIdAndEffectiveFrom(userId, effectiveFrom)
            .orElseGet(
                () -> {
                  var created = new UserGroupHistory();
                  created.setUserId(userId);
                  created.setEffectiveFrom(effectiveFrom);
                  return created;
                });
    row.setTeamGroup(teamGroup);
    groupHistoryRepository.save(row);
  }

  private static Specification<User> buildSpec(
      Department department,
      TeamGroup group,
      Role role,
      Boolean active,
      Boolean firstLogin,
      String search) {
    String normalized = (search == null || search.isBlank()) ? null : search.trim().toLowerCase();
    return (root, q, cb) -> {
      var predicates = new ArrayList<Predicate>();
      if (group != null) predicates.add(cb.equal(root.get("teamGroup"), group));
      if (role != null) predicates.add(cb.equal(root.get("role"), role));
      if (active != null) predicates.add(cb.equal(root.get("active"), active));
      if (firstLogin != null) predicates.add(cb.equal(root.get("firstLogin"), firstLogin));
      if (department != null) {
        var rolesInDept =
            switch (department) {
              case DEV -> List.of(Role.TEAM_LEAD_DEV, Role.DEV);
              case TEST -> List.of(Role.TEAM_LEAD_TEST, Role.TEST);
            };
        predicates.add(root.get("role").in(rolesInDept));
      }
      if (normalized != null) {
        var pattern = "%" + normalized + "%";
        var byUsername = cb.like(cb.lower(root.get("username")), pattern);
        var byFullName = cb.like(cb.lower(root.get("fullName")), pattern);
        predicates.add(cb.or(byUsername, byFullName));
      }
      if (q != null) q.orderBy(cb.asc(root.get("fullName")));
      return predicates.isEmpty() ? cb.conjunction() : cb.and(predicates.toArray(new Predicate[0]));
    };
  }
}
