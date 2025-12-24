package com.volteryde.auth.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Service for sending emails (password reset, verification, etc.)
 * 
 * Note: This is a placeholder implementation that logs emails.
 * In production, integrate with an email provider like SendGrid, AWS SES, or
 * SMTP.
 */
@Service
public class EmailService {

	private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

	@Value("${volteryde.auth.frontend-url:https://auth.volteryde.org}")
	private String authFrontendUrl;

	@Value("${volteryde.email.from:noreply@volteryde.org}")
	private String fromEmail;

	/**
	 * Send password reset email
	 */
	public void sendPasswordResetEmail(String toEmail, String resetToken, String firstName) {
		String resetLink = authFrontendUrl + "/reset-password?token=" + resetToken;

		String subject = "Reset Your Volteryde Password";
		String body = buildPasswordResetEmailBody(firstName, resetLink);

		// Log the email for now - in production, send via email provider
		logger.info("=== PASSWORD RESET EMAIL ===");
		logger.info("To: {}", toEmail);
		logger.info("From: {}", fromEmail);
		logger.info("Subject: {}", subject);
		logger.info("Reset Link: {}", resetLink);
		logger.debug("Body: {}", body);
		logger.info("============================");

		// In production, send via email provider:
		// emailProvider.send(fromEmail, toEmail, subject, body);
	}

	/**
	 * Send email verification email
	 */
	public void sendVerificationEmail(String toEmail, String verificationToken, String firstName) {
		String verifyLink = authFrontendUrl + "/verify-email?token=" + verificationToken;

		String subject = "Verify Your Volteryde Email";
		String body = buildVerificationEmailBody(firstName, verifyLink);

		logger.info("=== VERIFICATION EMAIL ===");
		logger.info("To: {}", toEmail);
		logger.info("From: {}", fromEmail);
		logger.info("Subject: {}", subject);
		logger.info("Verification Link: {}", verifyLink);
		logger.debug("Body: {}", body);
		logger.info("==========================");
	}

	/**
	 * Send welcome email after registration
	 */
	public void sendWelcomeEmail(String toEmail, String firstName) {
		String subject = "Welcome to Volteryde!";

		logger.info("=== WELCOME EMAIL ===");
		logger.info("To: {}", toEmail);
		logger.info("From: {}", fromEmail);
		logger.info("Subject: {}", subject);
		logger.info("=====================");
	}

	private String buildPasswordResetEmailBody(String firstName, String resetLink) {
		return String.format("""
				Hi %s,

				You requested to reset your Volteryde password. Click the link below to set a new password:

				%s

				This link will expire in 24 hours.

				If you didn't request this, please ignore this email.

				Best regards,
				The Volteryde Team
				""", firstName != null ? firstName : "there", resetLink);
	}

	private String buildVerificationEmailBody(String firstName, String verifyLink) {
		return String.format("""
				Hi %s,

				Welcome to Volteryde! Please verify your email address by clicking the link below:

				%s

				Best regards,
				The Volteryde Team
				""", firstName != null ? firstName : "there", verifyLink);
	}
}
