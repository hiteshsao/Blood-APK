package com.lifedrop.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI lifeDropOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("LifeDrop API")
                        .description("Blood Donation Network — connects donors and recipients directly.")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("LifeDrop Team")));
    }
}
