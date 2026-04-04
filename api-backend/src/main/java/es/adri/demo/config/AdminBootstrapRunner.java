package es.adri.demo.config;

import es.adri.demo.model.Role;
import es.adri.demo.model.User;
import es.adri.demo.repository.UserRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminBootstrapRunner implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AdminBootstrapProperties properties;

    public AdminBootstrapRunner(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AdminBootstrapProperties properties
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.properties = properties;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!properties.isEnabled()) {
            return;
        }

        userRepository.findByEmail(properties.getEmail())
                .filter(user -> !user.getUsername().equals(properties.getUsername()))
                .ifPresent(user -> {
                    throw new IllegalStateException("El email configurado para el admin ya esta en uso por otro usuario");
                });

        User adminUser = userRepository.findByUsername(properties.getUsername())
                .orElseGet(User::new);

        adminUser.setUsername(properties.getUsername());
        adminUser.setEmail(properties.getEmail());
        adminUser.setRole(Role.ROLE_ADMIN);

        if (adminUser.getPassword() == null || !passwordEncoder.matches(properties.getPassword(), adminUser.getPassword())) {
            adminUser.setPassword(passwordEncoder.encode(properties.getPassword()));
        }

        userRepository.save(adminUser);
    }
}
