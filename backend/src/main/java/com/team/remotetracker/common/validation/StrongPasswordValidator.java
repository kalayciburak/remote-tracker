package com.team.remotetracker.common.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class StrongPasswordValidator implements ConstraintValidator<StrongPassword, String> {

  private static final int MIN_LENGTH = 8;

  @Override
  public boolean isValid(String value, ConstraintValidatorContext context) {
    if (value == null) return true;
    if (value.length() < MIN_LENGTH) return false;
    boolean hasUpper = value.chars().anyMatch(Character::isUpperCase);
    boolean hasLower = value.chars().anyMatch(Character::isLowerCase);
    boolean hasDigit = value.chars().anyMatch(Character::isDigit);
    return hasUpper && hasLower && hasDigit;
  }
}
