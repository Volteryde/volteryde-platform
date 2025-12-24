package com.volteryde.auth.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

/**
 * Global exception handler for REST controllers
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

	private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

	@ExceptionHandler(AuthException.class)
	public ResponseEntity<ErrorResponse> handleAuthException(AuthException ex) {
		logger.warn("Authentication error: {}", ex.getMessage());

		ErrorResponse error = new ErrorResponse(
				"AUTH_ERROR",
				ex.getMessage());

		return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ErrorResponse> handleValidationException(MethodArgumentNotValidException ex) {
		Map<String, String> errors = new HashMap<>();
		ex.getBindingResult().getAllErrors().forEach((error) -> {
			String fieldName = ((FieldError) error).getField();
			String errorMessage = error.getDefaultMessage();
			errors.put(fieldName, errorMessage);
		});

		ErrorResponse error = new ErrorResponse(
				"VALIDATION_ERROR",
				"Validation failed",
				errors);

		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
		logger.error("Unexpected error: ", ex);

		ErrorResponse error = new ErrorResponse(
				"INTERNAL_ERROR",
				"An unexpected error occurred");

		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
	}

	/**
	 * Error response structure
	 */
	public static class ErrorResponse {
		private String code;
		private String message;
		private Map<String, ?> details;

		public ErrorResponse(String code, String message) {
			this.code = code;
			this.message = message;
		}

		public ErrorResponse(String code, String message, Map<String, ?> details) {
			this.code = code;
			this.message = message;
			this.details = details;
		}

		public String getCode() {
			return code;
		}

		public String getMessage() {
			return message;
		}

		public Map<String, ?> getDetails() {
			return details;
		}
	}
}
