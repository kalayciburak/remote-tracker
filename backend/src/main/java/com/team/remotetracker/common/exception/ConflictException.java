package com.team.remotetracker.common.exception;

import org.springframework.http.HttpStatus;

public class ConflictException extends BaseApiException {
  public ConflictException(String message) {
    this("CONFLICT", message);
  }

  public ConflictException(String code, String message) {
    super(HttpStatus.CONFLICT, code, message);
  }
}
