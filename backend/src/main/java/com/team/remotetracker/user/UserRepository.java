package com.team.remotetracker.user;

import com.team.remotetracker.user.entity.Role;
import com.team.remotetracker.user.entity.User;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface UserRepository extends JpaRepository<User, UUID>, JpaSpecificationExecutor<User> {

  Optional<User> findByUsername(String username);

  boolean existsByUsername(String username);

  long countByRoleAndActive(Role role, boolean active);

  List<User> findAllByActiveTrue();

  List<User> findAllByActiveTrueAndRoleIn(Collection<Role> roles);
}
