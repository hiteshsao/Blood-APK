package com.lifedrop.service.mail;

import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

/**
 * Production SMTP implementation of OtpMailSender using Spring JavaMailSender.
 * Catches any mail server exceptions and logs error messages only (never the code or full email body).
 */
@Slf4j
public class SmtpOtpMailSender implements OtpMailSender {

    private final JavaMailSender mailSender;
    private final String fromAddress;

    public SmtpOtpMailSender(JavaMailSender mailSender, String fromAddress) {
        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
    }

    @Override
    public void sendOtpEmail(String toEmail, String otpCode) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            if (fromAddress != null && !fromAddress.isBlank()) {
                message.setFrom(fromAddress);
            }
            message.setTo(toEmail);
            message.setSubject("Your LifeDrop login code");
            message.setText("Your LifeDrop login code is " + otpCode + ". It expires in 5 minutes. If you did not request this, you can ignore this email.");

            mailSender.send(message);
            log.info("Sent LifeDrop login OTP email to {}", toEmail);
        } catch (Exception e) {
            // Per security specification: log error message only, never the code or full body
            log.error("Failed to send OTP email to {}: {}", toEmail, e.getMessage());
        }
    }
}
