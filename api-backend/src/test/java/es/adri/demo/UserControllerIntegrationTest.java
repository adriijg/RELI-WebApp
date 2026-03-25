package es.adri.demo;

import es.adri.demo.dto.LoginRequestDTO;
import es.adri.demo.dto.UserRegistrationDTO;
import es.adri.demo.model.Role;
import es.adri.demo.model.User;
import es.adri.demo.repository.EventRepository;
import es.adri.demo.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import tools.jackson.databind.ObjectMapper;

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
class UserControllerIntegrationTest {

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
    void registerUserWithValidPayloadReturnsCreatedUser() throws Exception {
        UserRegistrationDTO request = new UserRegistrationDTO(
                "adri",
                "adri@example.com",
                "Password123"
        );

        mockMvc.perform(post("/api/users/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.username").value("adri"))
                .andExpect(jsonPath("$.email").value("adri@example.com"))
                .andExpect(jsonPath("$.createdAt").exists());
    }

    @Test
    void loginWithValidCredentialsReturnsAuthResponse() throws Exception {
        User user = new User();
        user.setUsername("adri");
        user.setEmail("adri@example.com");
        user.setPassword(passwordEncoder.encode("Password123"));
        user.setRole(Role.ROLE_USER);
        userRepository.save(user);

        LoginRequestDTO request = new LoginRequestDTO("adri", "Password123");

        mockMvc.perform(post("/api/users/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Login correcto"))
                .andExpect(jsonPath("$.user.username").value("adri"))
                .andExpect(jsonPath("$.user.email").value("adri@example.com"))
                .andExpect(jsonPath("$.user.createdAt").exists());
    }

    @Test
    void registerUserWithDuplicateEmailReturnsConflict() throws Exception {
        UserRegistrationDTO firstRequest = new UserRegistrationDTO(
                "adri",
                "shared@example.com",
                "Password123"
        );
        UserRegistrationDTO secondRequest = new UserRegistrationDTO(
                "adri2",
                "shared@example.com",
                "Password456"
        );

        mockMvc.perform(post("/api/users/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(firstRequest)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/users/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(secondRequest)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("El email ya esta en uso"));
    }

    @Test
    void getMissingUserReturnsNotFound() throws Exception {
        User admin = createUser("admin", "admin@example.com", "Password123", Role.ROLE_ADMIN);

        mockMvc.perform(get("/api/users/9999").header("Authorization", basicAuth(admin.getUsername(), "Password123")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Usuario no encontrado"));
    }

    @Test
    void registerUserWithInvalidPayloadReturnsBadRequest() throws Exception {
        UserRegistrationDTO request = new UserRegistrationDTO(
                "adri",
                "correo-invalido",
                "123"
        );

        mockMvc.perform(post("/api/users/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Los datos enviados no son validos"))
                .andExpect(jsonPath("$.validationErrors.email").value("El email no tiene un formato valido"))
                .andExpect(jsonPath("$.validationErrors.password").value("La password debe tener entre 8 y 100 caracteres"));
    }

    @Test
    void getAllUsersRequiresAdminRole() throws Exception {
        User user = createUser("user1", "user1@example.com", "Password123", Role.ROLE_USER);

        mockMvc.perform(get("/api/users").header("Authorization", basicAuth(user.getUsername(), "Password123")))
                .andExpect(status().isForbidden());
    }

    @Test
    void deleteUserAllowsAdminRole() throws Exception {
        User admin = createUser("admin", "admin@example.com", "Password123", Role.ROLE_ADMIN);
        User target = createUser("target", "target@example.com", "Password123", Role.ROLE_USER);

        mockMvc.perform(delete("/api/users/{id}", target.getId())
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
        String token = java.util.Base64.getEncoder().encodeToString((username + ":" + password).getBytes(java.nio.charset.StandardCharsets.UTF_8));
        return "Basic " + token;
    }
}
