package es.adri.demo;

import es.adri.demo.dto.StatRequestDTO;
import es.adri.demo.model.Competition;
import es.adri.demo.model.Match;
import es.adri.demo.model.MatchStatus;
import es.adri.demo.model.Player;
import es.adri.demo.model.Position;
import es.adri.demo.model.Role;
import es.adri.demo.model.Season;
import es.adri.demo.model.Stat;
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
class StatControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private StatRepository statRepository;

    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private MatchRepository matchRepository;

    @Autowired
    private CompetitionRepository competitionRepository;

    @Autowired
    private SeasonRepository seasonRepository;

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
    void getStatsIsPublic() throws Exception {
        Player player = createPlayer("Juan");
        Match match = createMatch("Rival FC");
        statRepository.save(new Stat(null, player, match, 2, 1, 0, 0, true, true));

        mockMvc.perform(get("/api/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].playerName").value("Juan"))
                .andExpect(jsonPath("$.content[0].matchRival").value("Rival FC"))
                .andExpect(jsonPath("$.content[0].goals").value(2));
    }

    @Test
    void getStatsByPlayerIdFiltersCorrectly() throws Exception {
        Player player = createPlayer("Juan");
        Match match = createMatch("Rival FC");
        statRepository.save(new Stat(null, player, match, 2, 1, 0, 0, true, true));

        mockMvc.perform(get("/api/stats").param("playerId", player.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].playerId").value(player.getId()));
    }

    @Test
    void createStatAsAdminReturnsCreated() throws Exception {
        User admin = createUser("admin", "admin@example.com", "Password123", Role.ROLE_ADMIN);
        Player player = createPlayer("Juan");
        Match match = createMatch("Rival FC");
        StatRequestDTO request = new StatRequestDTO(player.getId(), match.getId(), 2, 1, 0, 0, true, true);

        mockMvc.perform(post("/api/stats")
                        .header("Authorization", basicAuth(admin.getUsername(), "Password123"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.playerId").value(player.getId()))
                .andExpect(jsonPath("$.matchId").value(match.getId()))
                .andExpect(jsonPath("$.mvp").value(true))
                .andExpect(jsonPath("$.attended").value(true));
    }

    @Test
    void createStatRequiresAdminRole() throws Exception {
        User user = createUser("user1", "user1@example.com", "Password123", Role.ROLE_USER);
        Player player = createPlayer("Juan");
        Match match = createMatch("Rival FC");
        StatRequestDTO request = new StatRequestDTO(player.getId(), match.getId(), 2, 1, 0, 0, true, true);

        mockMvc.perform(post("/api/stats")
                        .header("Authorization", basicAuth(user.getUsername(), "Password123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void updateStatAsAdminReturnsUpdatedStat() throws Exception {
        User admin = createUser("admin", "admin@example.com", "Password123", Role.ROLE_ADMIN);
        Player player = createPlayer("Juan");
        Match match = createMatch("Rival FC");
        Stat stat = statRepository.save(new Stat(null, player, match, 2, 1, 0, 0, true, true));
        StatRequestDTO request = new StatRequestDTO(player.getId(), match.getId(), 3, 2, 1, 0, false, false);

        mockMvc.perform(put("/api/stats/{id}", stat.getId())
                        .header("Authorization", basicAuth(admin.getUsername(), "Password123"))
                        .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.goals").value(3))
                .andExpect(jsonPath("$.assists").value(2))
                .andExpect(jsonPath("$.mvp").value(false))
                .andExpect(jsonPath("$.attended").value(false));
    }

    @Test
    void deleteStatAsAdminReturnsNoContent() throws Exception {
        User admin = createUser("admin", "admin@example.com", "Password123", Role.ROLE_ADMIN);
        Player player = createPlayer("Juan");
        Match match = createMatch("Rival FC");
        Stat stat = statRepository.save(new Stat(null, player, match, 2, 1, 0, 0, true, true));

        mockMvc.perform(delete("/api/stats/{id}", stat.getId())
                        .header("Authorization", basicAuth(admin.getUsername(), "Password123")))
                .andExpect(status().isNoContent());
    }

    @Test
    void createStatWithUnknownPlayerReturnsNotFound() throws Exception {
        User admin = createUser("admin", "admin@example.com", "Password123", Role.ROLE_ADMIN);
        Match match = createMatch("Rival FC");
        StatRequestDTO request = new StatRequestDTO(9999L, match.getId(), 2, 1, 0, 0, true, true);

        mockMvc.perform(post("/api/stats")
                        .header("Authorization", basicAuth(admin.getUsername(), "Password123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Jugador no encontrado"));
    }

    private Player createPlayer(String name) {
        return playerRepository.save(new Player(null, name, name, 10, Position.ALA, "https://example.com/player.jpg", true));
    }

    private Match createMatch(String rival) {
        Season season = seasonRepository.save(new Season(null, "2025/2026", true));
        Competition competition = competitionRepository.save(new Competition(null, "Liga", season));
        return matchRepository.save(new Match(null, rival, LocalDateTime.now().plusDays(1), "Madrid", MatchStatus.SCHEDULED, 0, 0, competition));
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
