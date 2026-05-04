package com.team.remotetracker.common.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Documented
@Constraint(validatedBy = StrongPasswordValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface StrongPassword {
  String message() default "Parola en az 8 karakter, 1 büyük, 1 küçük, 1 rakam içermeli";

  Class<?>[] groups() default {};

  Class<? extends Payload>[] payload() default {};
}
