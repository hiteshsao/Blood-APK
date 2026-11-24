package com.lifedrop.service.mail;

/**
 * Contract for sending email OTP codes.
 */
public interface OtpMailSender {

    /**
     * Send an OTP code to the recipient email.
     *
     * @param toEmail recipient email address
     * @param otpCode 6-digit plain text code
     */
    void sendOtpEmail(String toEmail, String otpCode);
}
