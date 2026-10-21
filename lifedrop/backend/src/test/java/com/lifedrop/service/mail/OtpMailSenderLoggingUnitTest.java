package com.lifedrop.service.mail;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;

class OtpMailSenderLoggingUnitTest {

    @Test
    @DisplayName("LoggingOtpMailSender logs WARN message with DEV OTP for dev profile")
    void testLoggingOtpMailSenderLogsWarn() {
        Logger logger = (Logger) LoggerFactory.getLogger(LoggingOtpMailSender.class);
        ListAppender<ILoggingEvent> listAppender = new ListAppender<>();
        listAppender.start();
        logger.addAppender(listAppender);

        LoggingOtpMailSender sender = new LoggingOtpMailSender();
        sender.sendOtpEmail("donor1@lifedrop.test", "654321");

        List<ILoggingEvent> logs = listAppender.list;
        assertFalse(logs.isEmpty());
        ILoggingEvent event = logs.get(0);
        assertEquals(Level.WARN, event.getLevel());
        assertTrue(event.getFormattedMessage().contains("DEV OTP for donor1@lifedrop.test: 654321"));

        logger.detachAppender(listAppender);
    }

    @Test
    @DisplayName("SmtpOtpMailSender on failure logs error message only, never the plain OTP code")
    void testSmtpOtpMailSenderNeverLogsPlainCodeOnError() {
        Logger logger = (Logger) LoggerFactory.getLogger(SmtpOtpMailSender.class);
        ListAppender<ILoggingEvent> listAppender = new ListAppender<>();
        listAppender.start();
        logger.addAppender(listAppender);

        JavaMailSender mailSender = mock(JavaMailSender.class);
        doThrow(new MailSendException("SMTP Connection refused: port 587 unreachable"))
                .when(mailSender).send(any(SimpleMailMessage.class));

        SmtpOtpMailSender sender = new SmtpOtpMailSender(mailSender, "no-reply@lifedrop.app");
        String secretCode = "789123";

        // Must not throw exception
        assertDoesNotThrow(() -> sender.sendOtpEmail("patient@lifedrop.test", secretCode));

        List<ILoggingEvent> logs = listAppender.list;
        assertFalse(logs.isEmpty());
        for (ILoggingEvent event : logs) {
            assertEquals(Level.ERROR, event.getLevel());
            assertFalse(event.getFormattedMessage().contains(secretCode),
                    "Production SMTP logs MUST NEVER contain plain text OTP code!");
            assertTrue(event.getFormattedMessage().contains("Failed to send OTP email to patient@lifedrop.test"));
        }

        logger.detachAppender(listAppender);
    }
}
