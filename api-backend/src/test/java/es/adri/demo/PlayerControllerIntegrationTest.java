package es.adri.demo;

import es.adri.demo.dto.PlayerRequestDTO;
import es.adri.demo.model.Player;
import es.adri.demo.model.Position;
import es.adri.demo.model.Role;
import es.adri.demo.model.User;
import es.adri.demo.repository.PlayerRepository;
import es.adri.demo.repository.UserRepository;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.show-sql=false",
        "spring.jpa.open-in-view=false"
})
class PlayerControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        playerRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void getPlayersReturnsOnlyActivePlayers() throws Exception {
        playerRepository.save(new Player(null, "Jugador Activo", "Activo", 7, Position.ALA, "https://example.com/a.jpg", true));
        playerRepository.save(new Player(null, "Jugador Inactivo", "Inactivo", 10, Position.PIVOT, "https://example.com/b.jpg", false));

        mockMvc.perform(get("/api/players"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Jugador Activo"))
                .andExpect(jsonPath("$[0].active").value(true))
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void createPlayerRequiresAdminRole() throws Exception {
        User user = createUser("user1", "user1@example.com", "Password123", Role.ROLE_USER);
        PlayerRequestDTO request = validPlayerRequest();

        mockMvc.perform(post("/api/players")
                        .header("Authorization", basicAuth(user.getUsername(), "Password123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void createPlayerAsAdminReturnsCreated() throws Exception {
        User admin = createUser("admin", "admin@example.com", "Password123", Role.ROLE_ADMIN);
        PlayerRequestDTO request = validPlayerRequest();

        mockMvc.perform(post("/api/players")
                        .header("Authorization", basicAuth(admin.getUsername(), "Password123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Juan Perez"))
                .andExpect(jsonPath("$.position").value("ALA"))
                .andExpect(jsonPath("$.active").value(true));
    }

    @Test
    void updatePlayerAsAdminReturnsUpdatedPlayer() throws Exception {
        User admin = createUser("admin", "admin@example.com", "Password123", Role.ROLE_ADMIN);
        Player player = playerRepository.save(new Player(null, "Juan Perez", "Juan", 8, Position.ALA, "https://example.com/a.jpg", true));
        PlayerRequestDTO request = new PlayerRequestDTO("Juan Actualizado", "JP", 9, Position.PIVOT, "https://example.com/updated.jpg");

        mockMvc.perform(put("/api/players/{id}", player.getId())
                        .header("Authorization", basicAuth(admin.getUsername(), "Password123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Juan Actualizado"))
                .andExpect(jsonPath("$.jerseyNumber").value(9))
                .andExpect(jsonPath("$.position").value("PIVOT"));
    }

    @Test
    void deletePlayerAsAdminPerformsSoftDelete() throws Exception {
        User admin = createUser("admin", "admin@example.com", "Password123", Role.ROLE_ADMIN);
        Player player = playerRepository.save(new Player(null, "Juan Perez", "Juan", 8, Position.ALA, "https://example.com/a.jpg", true));

        mockMvc.perform(delete("/api/players/{id}", player.getId())
                        .header("Authorization", basicAuth(admin.getUsername(), "Password123")))
                .andExpect(status().isNoContent());

        org.junit.jupiter.api.Assertions.assertFalse(playerRepository.findById(player.getId()).orElseThrow().isActive());
    }

    @Test
    void createPlayerWithInvalidPayloadReturnsBadRequest() throws Exception {
        User admin = createUser("admin", "admin@example.com", "Password123", Role.ROLE_ADMIN);
        PlayerRequestDTO request = new PlayerRequestDTO("", "Juan", 0, Position.ALA, "not-a-url");

        mockMvc.perform(post("/api/players")
                        .header("Authorization", basicAuth(admin.getUsername(), "Password123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Los datos enviados no son validos"))
                .andExpect(jsonPath("$.validationErrors.name").value("El nombre es obligatorio"))
                .andExpect(jsonPath("$.validationErrors.jerseyNumber").value("El dorsal debe estar entre 1 y 99"))
                .andExpect(jsonPath("$.validationErrors.photoUrl").value("La URL de la foto no es valida"));
    }

    private PlayerRequestDTO validPlayerRequest() {
        return new PlayerRequestDTO("Juan Perez", "Juan", 8, Position.ALA, "https://example.com/player.jpg");
    }

    private User createUser(String username, String email, String rawPassword, Role role) {
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setRole(role);
        return userRepository.save(user);
    }

    private String basicAuth(String username, String password) {
        String token = Base64.getEncoder().encodeToString((username + ":" + password).getBytes(StandardCharsets.UTF_8));
        return "Basic " + token;
    }
}
