package es.adri.demo.config;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class JwtServiceTest {

    @Test
    void rejectsBlankSecret() {
        JwtService jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secret", "");

        assertThrows(IllegalStateException.class, jwtService::validateSecret);
    }

    @Test
    void rejectsShortSecret() {
        JwtService jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secret", "demasiado-corto");

        assertThrows(IllegalStateException.class, jwtService::validateSecret);
    }

    @Test
    void acceptsSecretWithAtLeast32Bytes() {
        JwtService jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secret", "0123456789-0123456789-0123456789");

        assertDoesNotThrow(jwtService::validateSecret);
    }
}
