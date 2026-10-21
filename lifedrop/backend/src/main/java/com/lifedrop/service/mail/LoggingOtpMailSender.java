package com.lifedrop.service.mail;

import lombok.extern.slf4j.Slf4j;

/**
 * Dev/Local implementation of OtpMailSender.
 * Logs "DEV OTP for <email>: <code>" at WARN level to the console.
 * Per security specification, this is the ONLY location in the codebase where an OTP code may ever be logged.
 */
@Slf4j
public class LoggingOtpMailSender implements OtpMailSender {

    @Override
    public void sendOtpEmail(String toEmail, String otpCode) {
        log.warn("DEV OTP for {}: {}", toEmail, otpCode);
    }
}
