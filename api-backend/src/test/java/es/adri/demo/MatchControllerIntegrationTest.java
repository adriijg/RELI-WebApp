package es.adri.demo;

import es.adri.demo.dto.MatchRequestDTO;
import es.adri.demo.model.Competition;
import es.adri.demo.model.Match;
import es.adri.demo.model.MatchStatus;
import es.adri.demo.model.Role;
import es.adri.demo.model.Season;
import es.adri.demo.model.User;
import es.adri.demo.repository.CompetitionRepository;
import es.adri.demo.repository.MatchRepository;
import es.adri.demo.repository.PlayerRepository;
import es.adri.demo.repository.SeasonRepository;
import es.adri.demo.repository.StatRepository;
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
class MatchControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private MatchRepository matchRepository;

    @Autowired
    private CompetitionRepository competitionRepository;

    @Autowired
    private SeasonRepository seasonRepository;

    @Autowired
    private StatRepository statRepository;

    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        statRepository.deleteAll();
        playerRepository.deleteAll();
        matchRepository.deleteAll();
        competitionRepository.deleteAll();
        seasonRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void getMatchesIsPublic() throws Exception {
        Competition competition = createCompetition("Liga");
        matchRepository.save(new Match(null, "Rival FC", LocalDateTime.now().plusDays(1), "Madrid", MatchStatus.SCHEDULED, 0, 0, competition));

        mockMvc.perform(get("/api/matches"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].rival").value("Rival FC"))
                .andExpect(jsonPath("$.content[0].competitionName").value("Liga"));
    }

    @Test
    void createMatchAsAdminReturnsCreated() throws Exception {
        User admin = createUser("admin", "admin@example.com", "Password123", Role.ROLE_ADMIN);
        Competition competition = createCompetition("Liga");
        MatchRequestDTO request = new MatchRequestDTO(
                "Rival FC",
                LocalDateTime.now().plusDays(1),
                "Madrid",
                MatchStatus.SCHEDULED,
                0,
                0,
                competition.getId()
        );

        mockMvc.perform(post("/api/matches")
                        .header("Authorization", basicAuth(admin.getUsername(), "Password123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.rival").value("Rival FC"))
                .andExpect(jsonPath("$.competitionId").value(competition.getId()));
    }

    @Test
    void createMatchRequiresAdminRole() throws Exception {
        User user = createUser("user1", "user1@example.com", "Password123", Role.ROLE_USER);
        Competition competition = createCompetition("Liga");
        MatchRequestDTO request = new MatchRequestDTO(
                "Rival FC",
                LocalDateTime.now().plusDays(1),
                "Madrid",
                MatchStatus.SCHEDULED,
                0,
                0,
                competition.getId()
        );

        mockMvc.perform(post("/api/matches")
                        .header("Authorization", basicAuth(user.getUsername(), "Password123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void updateMatchAsAdminReturnsUpdatedMatch() throws Exception {
        User admin = createUser("admin", "admin@example.com", "Password123", Role.ROLE_ADMIN);
        Competition competition = createCompetition("Liga");
        Competition otherCompetition = createCompetition("Copa");
        Match match = matchRepository.save(new Match(null, "Rival FC", LocalDateTime.now().plusDays(1), "Madrid", MatchStatus.SCHEDULED, 0, 0, competition));
        MatchRequestDTO request = new MatchRequestDTO(
                "Otro Rival",
                LocalDateTime.now().plusDays(2),
                "Barcelona",
                MatchStatus.FINISHED,
                2,
                1,
                otherCompetition.getId()
        );

        mockMvc.perform(put("/api/matches/{id}", match.getId())
                        .header("Authorization", basicAuth(admin.getUsername(), "Password123"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rival").value("Otro Rival"))
                .andExpect(jsonPath("$.status").value("FINISHED"))
                .andExpect(jsonPath("$.competitionName").value("Copa"));
    }

    @Test
    void deleteMatchAsAdminReturnsNoContent() throws Exception {
        User admin = createUser("admin", "admin@example.com", "Password123", Role.ROLE_ADMIN);
        Competition competition = createCompetition("Liga");
        Match match = matchRepository.save(new Match(null, "Rival FC", LocalDateTime.now().plusDays(1), "Madrid", MatchStatus.SCHEDULED, 0, 0, competition));

        mockMvc.perform(delete("/api/matches/{id}", match.getId())
                        .header("Authorization", basicAuth(admin.getUsername(), "Password123")))
                .andExpect(status().isNoContent());
    }

    @Test
    void createMatchWithUnknownCompetitionReturnsNotFound() throws Exception {
        User admin = createUser("admin", "admin@example.com", "Password123", Role.ROLE_ADMIN);
        MatchRequestDTO request = new MatchRequestDTO(
                "Rival FC",
                LocalDateTime.now().plusDays(1),
                "Madrid",
                MatchStatus.SCHEDULED,
                0,
                0,
                9999L
        );

        mockMvc.perform(post("/api/matches")
                        .header("Authorization", basicAuth(admin.getUsername(), "Password123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Competicion no encontrada"));
    }

    private Competition createCompetition(String name) {
        Season season = seasonRepository.save(new Season(null, "2025/2026", true));
        return competitionRepository.save(new Competition(null, name, season));
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
