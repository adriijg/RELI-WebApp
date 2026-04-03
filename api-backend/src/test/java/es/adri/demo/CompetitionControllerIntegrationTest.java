package es.adri.demo;

import es.adri.demo.dto.CompetitionRequestDTO;
import es.adri.demo.model.Competition;
import es.adri.demo.model.Role;
import es.adri.demo.model.Season;
import es.adri.demo.model.User;
import es.adri.demo.repository.CompetitionRepository;
import es.adri.demo.repository.MatchRepository;
import es.adri.demo.repository.SeasonRepository;
import es.adri.demo.repository.StatRepository;
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
class CompetitionControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CompetitionRepository competitionRepository;

    @Autowired
    private SeasonRepository seasonRepository;

    @Autowired
    private MatchRepository matchRepository;

    @Autowired
    private StatRepository statRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        statRepository.deleteAll();
        matchRepository.deleteAll();
        competitionRepository.deleteAll();
        seasonRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void getCompetitionsIsPublic() throws Exception {
        Season season = seasonRepository.save(new Season(null, "2025/2026", true));
        competitionRepository.save(new Competition(null, "Liga", season));

        mockMvc.perform(get("/api/competitions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Liga"))
                .andExpect(jsonPath("$[0].seasonName").value("2025/2026"));
    }

    @Test
    void createCompetitionAsAdminReturnsCreated() throws Exception {
        User admin = createUser("admin", "admin@example.com", "Password123", Role.ROLE_ADMIN);
        Season season = seasonRepository.save(new Season(null, "2025/2026", true));
        CompetitionRequestDTO request = new CompetitionRequestDTO("Liga", season.getId());

        mockMvc.perform(post("/api/competitions")
                        .header("Authorization", basicAuth(admin.getUsername(), "Password123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Liga"))
                .andExpect(jsonPath("$.seasonId").value(season.getId()));
    }

    @Test
    void createCompetitionRequiresAdminRole() throws Exception {
        User user = createUser("user1", "user1@example.com", "Password123", Role.ROLE_USER);
        Season season = seasonRepository.save(new Season(null, "2025/2026", true));
        CompetitionRequestDTO request = new CompetitionRequestDTO("Liga", season.getId());

        mockMvc.perform(post("/api/competitions")
                        .header("Authorization", basicAuth(user.getUsername(), "Password123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void updateCompetitionAsAdminReturnsUpdatedCompetition() throws Exception {
        User admin = createUser("admin", "admin@example.com", "Password123", Role.ROLE_ADMIN);
        Season season = seasonRepository.save(new Season(null, "2025/2026", true));
        Season newSeason = seasonRepository.save(new Season(null, "2026/2027", false));
        Competition competition = competitionRepository.save(new Competition(null, "Liga", season));
        CompetitionRequestDTO request = new CompetitionRequestDTO("Copa", newSeason.getId());

        mockMvc.perform(put("/api/competitions/{id}", competition.getId())
                        .header("Authorization", basicAuth(admin.getUsername(), "Password123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Copa"))
                .andExpect(jsonPath("$.seasonName").value("2026/2027"));
    }

    @Test
    void deleteCompetitionAsAdminReturnsNoContent() throws Exception {
        User admin = createUser("admin", "admin@example.com", "Password123", Role.ROLE_ADMIN);
        Season season = seasonRepository.save(new Season(null, "2025/2026", true));
        Competition competition = competitionRepository.save(new Competition(null, "Liga", season));

        mockMvc.perform(delete("/api/competitions/{id}", competition.getId())
                        .header("Authorization", basicAuth(admin.getUsername(), "Password123")))
                .andExpect(status().isNoContent());
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
