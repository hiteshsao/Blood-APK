package com.lifedrop;

import com.lifedrop.config.DatabaseUrlEnvironmentInitializer;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(BackendApplication.class);
        app.addInitializers(new DatabaseUrlEnvironmentInitializer());
        app.run(args);
    }
}

