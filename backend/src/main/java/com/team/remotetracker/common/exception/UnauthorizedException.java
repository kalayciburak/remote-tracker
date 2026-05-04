package com.team.remotetracker.common.exception;

import org.springframework.http.HttpStatus;

public class UnauthorizedException extends BaseApiException {
  public UnauthorizedException(String message) {
    super(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", message);
  }
}
