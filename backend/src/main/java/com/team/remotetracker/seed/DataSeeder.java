package com.team.remotetracker.seed;

import com.team.remotetracker.config.AppProperties;
import com.team.remotetracker.user.UserRepository;
import com.team.remotetracker.user.entity.Role;
import com.team.remotetracker.user.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DataSeeder implements ApplicationRunner {

  private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);
  private static final String BOOTSTRAP_FULL_NAME = "Bootstrap Admin";

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final AppProperties properties;

  public DataSeeder(
      UserRepository userRepository, PasswordEncoder passwordEncoder, AppProperties properties) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.properties = properties;
  }

  @Override
  @Transactional
  public void run(ApplicationArguments args) {
    seedBootstrapAdmin();
  }

  private void seedBootstrapAdmin() {
    if (userRepository.count() > 0) {
      log.info(
          "Skipping bootstrap admin seed (users already exist, count={})", userRepository.count());
      return;
    }

    String username = properties.security().bootstrapUsername();
    var hashed = passwordEncoder.encode(properties.seed().initialUserPassword());
    var admin = new User();
    admin.setUsername(username);
    admin.setFullName(BOOTSTRAP_FULL_NAME);
    admin.setPasswordHash(hashed);
    admin.setRole(Role.SUPER_ADMIN);
    admin.setTeamGroup(null);
    admin.setFirstLogin(false);
    admin.setActive(true);
    userRepository.save(admin);

    log.info("Seeded bootstrap admin user: {}", username);
  }
}
