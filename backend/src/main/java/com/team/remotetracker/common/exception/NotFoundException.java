package com.team.remotetracker.common.exception;

import org.springframework.http.HttpStatus;

public class NotFoundException extends BaseApiException {
  public NotFoundException(String message) {
    super(HttpStatus.NOT_FOUND, "NOT_FOUND", message);
  }
}
