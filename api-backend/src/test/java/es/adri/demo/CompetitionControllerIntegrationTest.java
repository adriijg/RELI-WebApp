package es.adri.demo;

import es.adri.demo.dto.CompetitionRequestDTO;
import es.adri.demo.model.Competition;
import es.adri.demo.model.CompetitionType;
import es.adri.demo.model.Match;
import es.adri.demo.model.MatchStatus;
import es.adri.demo.model.Role;
import es.adri.demo.model.Season;
import es.adri.demo.model.User;
import es.adri.demo.repository.CompetitionRepository;
import es.adri.demo.repository.MatchRepository;
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
        "spring.jpa.open-in-view=false",
        "app.email.enabled=false",
        "spring.security.oauth2.client.registration.google.client-id=test-client-id",
        "spring.security.oauth2.client.registration.google.client-secret=test-client-secret"
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
        competitionRepository.save(new Competition(null, "Liga", CompetitionType.LIGA, season, null, null, null, null));

        mockMvc.perform(get("/api/competitions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].name").value("Liga"))
                .andExpect(jsonPath("$.content[0].seasonName").value("2025/2026"));
    }

    @Test
    void createCompetitionAsAdminReturnsCreated() throws Exception {
        User admin = createUser("admin", "admin@example.com", "Password123", Role.ROLE_ADMIN);
        Season season = seasonRepository.save(new Season(null, "2025/2026", true));
        CompetitionRequestDTO request = new CompetitionRequestDTO("Liga", CompetitionType.LIGA, season.getId(), null, null, null, null);

        mockMvc.perform(post("/api/competitions")
                        .header("Authorization", basicAuth(admin.getUsername(), "Password123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Liga"))
                .andExpect(jsonPath("$.type").value("LIGA"))
                .andExpect(jsonPath("$.seasonId").value(season.getId()));
    }

    @Test
    void createCompetitionRequiresAdminRole() throws Exception {
        User user = createUser("user1", "user1@example.com", "Password123", Role.ROLE_USER);
        Season season = seasonRepository.save(new Season(null, "2025/2026", true));
        CompetitionRequestDTO request = new CompetitionRequestDTO("Liga", CompetitionType.LIGA, season.getId(), null, null, null, null);

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
        Competition competition = competitionRepository.save(new Competition(null, "Liga", CompetitionType.LIGA, season, null, null, null, null));
        CompetitionRequestDTO request = new CompetitionRequestDTO("Copa", CompetitionType.COPA, newSeason.getId(), null, null, null, null);

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
        Competition competition = competitionRepository.save(new Competition(null, "Liga", CompetitionType.LIGA, season, null, null, null, null));

        mockMvc.perform(delete("/api/competitions/{id}", competition.getId())
                        .header("Authorization", basicAuth(admin.getUsername(), "Password123")))
                .andExpect(status().isNoContent());
    }

    @Test
    void getStandingsIsPublicAndOrdered() throws Exception {
        Season season = seasonRepository.save(new Season(null, "2025/2026", true));
        Competition competition = competitionRepository.save(new Competition(null, "Liga", CompetitionType.LIGA, season, null, null, null, null));
        matchRepository.save(new Match(null, "Rival A", true, LocalDateTime.now().minusDays(3), "Madrid", MatchStatus.FINISHED, 3, 1, 1, competition));
        matchRepository.save(new Match(null, "Rival B", false, LocalDateTime.now().minusDays(2), "Fuera", MatchStatus.FINISHED, 2, 2, 1, competition));
        matchRepository.save(new Match(null, "Rival C", true, LocalDateTime.now().plusDays(1), "Madrid", MatchStatus.SCHEDULED, 0, 0, 2, competition));

        mockMvc.perform(get("/api/competitions/{id}/standings", competition.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].teamName").value("REAL LISIADOS"))
                .andExpect(jsonPath("$[0].played").value(2))
                .andExpect(jsonPath("$[0].points").value(4))
                .andExpect(jsonPath("$[0].form").value("VE"))
                .andExpect(jsonPath("$[1].teamName").value("Rival B"))
                .andExpect(jsonPath("$[1].points").value(1))
                .andExpect(jsonPath("$[2].teamName").value("Rival C"))
                .andExpect(jsonPath("$[2].played").value(0))
                .andExpect(jsonPath("$[3].teamName").value("Rival A"))
                .andExpect(jsonPath("$[3].points").value(0));
    }

    @Test
    void getStandingsUpToJornadaIncludesAllTeams() throws Exception {
        Season season = seasonRepository.save(new Season(null, "2025/2026", true));
        Competition competition = competitionRepository.save(new Competition(null, "Liga", CompetitionType.LIGA, season, null, null, null, null));
        matchRepository.save(new Match(null, "Rival A", true, LocalDateTime.now().minusDays(3), "Madrid", MatchStatus.FINISHED, 3, 1, 1, competition));
        matchRepository.save(new Match(null, "Rival B", false, LocalDateTime.now().plusDays(5), "Fuera", MatchStatus.SCHEDULED, 0, 0, 5, competition));

        mockMvc.perform(get("/api/competitions/{id}/standings", competition.getId()).param("jornada", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].teamName").value("REAL LISIADOS"))
                .andExpect(jsonPath("$[0].points").value(3))
                .andExpect(jsonPath("$[0].form").value("V"))
                .andExpect(jsonPath("$[1].teamName").value("Rival B"))
                .andExpect(jsonPath("$[1].played").value(0))
                .andExpect(jsonPath("$[2].teamName").value("Rival A"))
                .andExpect(jsonPath("$[2].played").value(1));
    }

    @Test
    void getStandingsWithUnknownCompetitionReturnsNotFound() throws Exception {
        mockMvc.perform(get("/api/competitions/{id}/standings", 9999L))
                .andExpect(status().isNotFound());
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
