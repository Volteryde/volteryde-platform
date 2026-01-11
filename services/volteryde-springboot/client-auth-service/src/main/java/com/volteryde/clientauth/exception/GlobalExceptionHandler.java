package com.volteryde.clientauth.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Global Exception Handler for Client Auth Service
 * 
 * Austin: Centralizes exception handling to provide consistent
 * error responses across all endpoints. This ensures the Client-App
 * receives standardized error messages for proper error handling.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Handle custom ClientAuthException and its subclasses
     */
    @ExceptionHandler(ClientAuthException.class)
    public ResponseEntity<ErrorResponse> handleClientAuthException(ClientAuthException ex) {
        logger.warn("Client auth error: {} - {}", ex.getErrorCode(), ex.getMessage());
        
        ErrorResponse error = new ErrorResponse(
                ex.getStatus().value(),
                ex.getErrorCode(),
                ex.getMessage(),
                LocalDateTime.now()
        );
        
        return new ResponseEntity<>(error, ex.getStatus());
    }

    /**
     * Handle validation errors
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String message = error.getDefaultMessage();
            errors.put(fieldName, message);
        });

        String message = errors.values().stream().findFirst().orElse("Validation failed");
        
        ErrorResponse error = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "VALIDATION_ERROR",
                message,
                LocalDateTime.now()
        );
        error.setDetails(errors);
        
        logger.warn("Validation error: {}", errors);
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handle generic RuntimeException (fallback for uncaught exceptions)
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handleRuntimeException(RuntimeException ex) {
        logger.error("Unexpected error: {}", ex.getMessage(), ex);
        
        ErrorResponse error = new ErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "INTERNAL_ERROR",
                "An unexpected error occurred",
                LocalDateTime.now()
        );
        
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    /**
     * Error response structure
     */
    public static class ErrorResponse {
        private int status;
        private String errorCode;
        private String message;
        private LocalDateTime timestamp;
        private Map<String, String> details;

        public ErrorResponse(int status, String errorCode, String message, LocalDateTime timestamp) {
            this.status = status;
            this.errorCode = errorCode;
            this.message = message;
            this.timestamp = timestamp;
        }

        public int getStatus() { return status; }
        public void setStatus(int status) { this.status = status; }

        public String getErrorCode() { return errorCode; }
        public void setErrorCode(String errorCode) { this.errorCode = errorCode; }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }

        public LocalDateTime getTimestamp() { return timestamp; }
        public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

        public Map<String, String> getDetails() { return details; }
        public void setDetails(Map<String, String> details) { this.details = details; }
    }
}
