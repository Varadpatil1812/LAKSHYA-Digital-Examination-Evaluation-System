package com.cdac;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "SECRET_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    "EXP_TIMEOUT=86400000"
})
@DisplayName("Application context loads successfully")
class BackendApplicationTests {

    @Test
    @DisplayName("Spring context loads without errors")
    void contextLoads() {
        // Passes if context starts up cleanly
    }
}
