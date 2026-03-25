package es.adri.demo;

import es.adri.demo.dto.EventCreateDTO;
import es.adri.demo.model.Role;
import es.adri.demo.model.User;
import es.adri.demo.repository.EventRepository;
import es.adri.demo.repository.UserRepository;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
class EventControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        eventRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void createEventAllowsAdminRole() throws Exception {
        User admin = createUser("admin", "admin@example.com", "Password123", Role.ROLE_ADMIN);
        EventCreateDTO request = new EventCreateDTO(
                "Madrid",
                "Barca",
                LocalDateTime.now().plusDays(2),
                "Bernabeu",
                "0-0"
        );

        mockMvc.perform(post("/api/events")
                        .header("Authorization", basicAuth(admin.getUsername(), "Password123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.homeTeam").value("Madrid"))
                .andExpect(jsonPath("$.awayTeam").value("Barca"))
                .andExpect(jsonPath("$.createdByUsername").value("admin"));
    }

    @Test
    void createEventRejectsUserRole() throws Exception {
        User user = createUser("user1", "user1@example.com", "Password123", Role.ROLE_USER);
        EventCreateDTO request = new EventCreateDTO(
                "Madrid",
                "Barca",
                LocalDateTime.now().plusDays(2),
                "Bernabeu",
                "0-0"
        );

        mockMvc.perform(post("/api/events")
                        .header("Authorization", basicAuth(user.getUsername(), "Password123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void getAllEventsIsPublic() throws Exception {
        mockMvc.perform(get("/api/events"))
                .andExpect(status().isOk());
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
