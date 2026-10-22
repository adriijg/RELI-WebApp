package es.adri.demo.config;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;

import es.adri.demo.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

class AdminBootstrapRunnerTest {

    @Test
    void enabledBootstrapWithoutPasswordFailsFast() {
        AdminBootstrapProperties properties = new AdminBootstrapProperties();
        properties.setEnabled(true);
        AdminBootstrapRunner runner = new AdminBootstrapRunner(
                mock(UserRepository.class),
                mock(PasswordEncoder.class),
                properties
        );

        assertThrows(IllegalStateException.class, () -> runner.run(null));
    }

    @Test
    void disabledBootstrapDoesNotRequirePassword() {
        AdminBootstrapProperties properties = new AdminBootstrapProperties();
        properties.setEnabled(false);
        UserRepository userRepository = mock(UserRepository.class);
        AdminBootstrapRunner runner = new AdminBootstrapRunner(
                userRepository,
                mock(PasswordEncoder.class),
                properties
        );

        assertDoesNotThrow(() -> runner.run(null));
        verifyNoInteractions(userRepository);
    }
}
