package com.lifedrop.config;

import com.lifedrop.service.mail.LoggingOtpMailSender;
import com.lifedrop.service.mail.OtpMailSender;
import com.lifedrop.service.mail.SmtpOtpMailSender;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.mail.javamail.JavaMailSender;

import java.time.Clock;
import java.util.Arrays;

/**
 * Spring configuration providing the Clock bean and OtpMailSender implementation.
 */
@Configuration
public class OtpConfig {

    @Bean
    @ConditionalOnMissingBean(Clock.class)
    public Clock clock() {
        return Clock.systemUTC();
    }

    @Bean
    @ConditionalOnMissingBean(OtpMailSender.class)
    public OtpMailSender otpMailSender(
            Environment env,
            ObjectProvider<JavaMailSender> mailSenderProvider,
            @Value("${app.otp.mail-enabled:true}") boolean mailEnabled,
            @Value("${app.mail.from:no-reply@lifedrop.app}") String fromAddress
    ) {
        boolean isDev = Arrays.asList(env.getActiveProfiles()).contains("dev");
        if (isDev || !mailEnabled) {
            return new LoggingOtpMailSender();
        }
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            return new LoggingOtpMailSender();
        }
        return new SmtpOtpMailSender(mailSender, fromAddress);
    }
}
