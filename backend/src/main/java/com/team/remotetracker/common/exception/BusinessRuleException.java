package com.team.remotetracker.common.exception;

import org.springframework.http.HttpStatus;

public class BusinessRuleException extends BaseApiException {
  public BusinessRuleException(String code, String message) {
    super(HttpStatus.CONFLICT, code, message);
  }

  public BusinessRuleException(HttpStatus status, String code, String message) {
    super(status, code, message);
  }
}
