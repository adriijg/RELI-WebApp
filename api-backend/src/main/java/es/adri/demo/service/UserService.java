package es.adri.demo.service;

import es.adri.demo.dto.AuthResponseDTO;
import es.adri.demo.config.JwtService;
import es.adri.demo.dto.GoogleAuthRequest;
import es.adri.demo.dto.LoginRequestDTO;
import es.adri.demo.dto.UserDTO;
import es.adri.demo.dto.UserRegistrationDTO;
import es.adri.demo.dto.UserUpdateDTO;
import es.adri.demo.model.EmailToken;
import es.adri.demo.exception.EmailAlreadyExistsException;
import es.adri.demo.exception.ResourceNotFoundException;
import es.adri.demo.model.Role;
import es.adri.demo.model.User;
import es.adri.demo.repository.UserRepository;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.client.RestTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailTokenService emailTokenService;
    private final RestTemplate restTemplate;

    @org.springframework.beans.factory.annotation.Value("${app.email.enabled:false}")
    private boolean emailEnabled;

    @org.springframework.beans.factory.annotation.Value("${GOOGLE_CLIENT_ID:}")
    private String googleClientId;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService,
                       EmailTokenService emailTokenService, RestTemplate restTemplate) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.emailTokenService = emailTokenService;
        this.restTemplate = restTemplate;
    }

    public UserDTO saveUser(UserRegistrationDTO userRegistrationDTO) {
        validateNewUser(userRegistrationDTO.getUsername(), userRegistrationDTO.getEmail());

        User user = new User();
        user.setUsername(userRegistrationDTO.getUsername());
        user.setEmail(userRegistrationDTO.getEmail());
        user.setPassword(passwordEncoder.encode(userRegistrationDTO.getPassword()));
        user.setRole(Role.ROLE_USER);
        user.setEmailVerified(!emailEnabled);

        User savedUser = userRepository.save(user);
        if (emailEnabled) {
            try {
                emailTokenService.sendVerification(savedUser);
            } catch (Exception e) {
                log.error("No se pudo enviar el email de verificación a {}", savedUser.getEmail(), e);
            }
        }
        return toDto(savedUser);
    }

    public List<UserDTO> findAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private static final String GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo";

    public AuthResponseDTO googleLogin(String idToken) {
        try {
            String encodedToken = URLEncoder.encode(idToken, StandardCharsets.UTF_8);
            String url = GOOGLE_TOKENINFO_URL + "?id_token=" + encodedToken;
            log.info("Calling Google tokeninfo with url: {}...", url.substring(0, Math.min(80, url.length())));
            ResponseEntity<Map> response;
            try {
                response = restTemplate.getForEntity(url, Map.class);
            } catch (Exception e) {
                log.error("Error calling Google tokeninfo: {}", e.getMessage(), e);
                throw new ResponseStatusException(UNAUTHORIZED, "Token de Google inválido");
            }
            if (response.getStatusCode().value() != 200 || response.getBody() == null) {
                log.error("Google tokeninfo returned status: {} body: {}", response.getStatusCode(), response.getBody());
                throw new ResponseStatusException(UNAUTHORIZED, "Token de Google inválido");
            }
            Map<String, Object> googleProfile = response.getBody();
            log.info("Google profile aud={}, sub={}, email={}, email_verified={}, azp={}",
                    googleProfile.get("aud"), googleProfile.get("sub"),
                    googleProfile.get("email"), googleProfile.get("email_verified"),
                    googleProfile.get("azp"));
            Object aud = googleProfile.get("aud");
            if (aud == null || !String.valueOf(aud).equals(googleClientId)) {
                log.error("Token audience mismatch: aud={}, expected={}", aud, googleClientId);
                throw new ResponseStatusException(UNAUTHORIZED, "Token de Google inválido");
            }
            Object verified = googleProfile.get("email_verified");
            if (verified == null || !Boolean.parseBoolean(verified.toString())) {
                log.error("email_verified is not true: {}", verified);
                throw new ResponseStatusException(UNAUTHORIZED, "Token de Google inválido");
            }
            String googleId = String.valueOf(googleProfile.get("sub"));
            String email = String.valueOf(googleProfile.get("email"));
            String name = googleProfile.get("name") != null ? String.valueOf(googleProfile.get("name")) : null;

            User user = userRepository.findByGoogleId(googleId).orElse(null);
            boolean wasNewUser = false;

            if (user == null) {
                Optional<User> byEmail = userRepository.findByEmail(email);
                if (byEmail.isPresent()) {
                    user = byEmail.get();
                    user.setGoogleId(googleId);
                    user = userRepository.save(user);
                } else {
                    String username = name != null ? name.toLowerCase().replaceAll("[^a-z0-9]", "_") : email.split("@")[0];
                    if (username.length() < 3) username = "user_" + googleId.substring(0, Math.min(googleId.length(), 8));
                    if (userRepository.existsByUsername(username)) {
                        username = email.split("@")[0];
                        if (userRepository.existsByUsername(username)) {
                            username = username + "_" + googleId.substring(0, 6);
                        }
                    }
                    user = new User();
                    user.setUsername(username);
                    user.setEmail(email);
                    user.setPassword(passwordEncoder.encode("google_" + googleId));
                    user.setGoogleId(googleId);
                    user.setRole(Role.ROLE_USER);
                    user.setEmailVerified(true);
                    user = userRepository.save(user);
                    wasNewUser = true;
                }
            }

            String token = jwtService.generateToken(user.getUsername(), user.getRole().name());
            UserDTO userDto = toDto(user);
            return new AuthResponseDTO(wasNewUser ? "Registro e inicio de sesión con Google correcto" : "Inicio de sesión con Google correcto", token, userDto);
        } catch (Exception e) {
            log.error("Error en login con Google", e);
            throw new ResponseStatusException(UNAUTHORIZED, "Error en la autenticación con Google");
        }
    }

    public AuthResponseDTO loginUser(LoginRequestDTO loginRequestDTO) {
        User user = userRepository.findByUsername(loginRequestDTO.getIdentifier())
                .or(() -> userRepository.findByEmail(loginRequestDTO.getIdentifier()))
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "Credenciales invalidas"));

        if (!passwordEncoder.matches(loginRequestDTO.getPassword(), user.getPassword())) {
            throw new ResponseStatusException(UNAUTHORIZED, "Credenciales invalidas");
        }
        if (emailEnabled && Boolean.FALSE.equals(user.getEmailVerified())) {
            throw new ResponseStatusException(UNAUTHORIZED, "Confirma tu email antes de iniciar sesión");
        }

        String token = jwtService.generateToken(user.getUsername(), user.getRole().name());
        return new AuthResponseDTO("Login correcto", token, toDto(user));
    }

    public UserDTO findUserById(Long id) {
        return toDto(getUserEntityById(id));
    }

    public UserDTO updateUser(Long id, UserUpdateDTO userUpdateDTO) {
        User user = getUserEntityById(id);
        validateExistingUser(id, userUpdateDTO.getUsername(), userUpdateDTO.getEmail());

        user.setUsername(userUpdateDTO.getUsername());
        user.setEmail(userUpdateDTO.getEmail());
        if (userUpdateDTO.getPassword() != null && !userUpdateDTO.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(userUpdateDTO.getPassword()));
        }

        return toDto(userRepository.save(user));
    }

    public void deleteUser(Long id) {
        User user = getUserEntityById(id);
        userRepository.delete(user);
    }

    private User getUserEntityById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
    }

    private void validateNewUser(String username, String email) {
        if (userRepository.existsByUsername(username)) {
            throw new ResponseStatusException(CONFLICT, "El username ya esta en uso");
        }
        if (userRepository.existsByEmail(email)) {
            throw new EmailAlreadyExistsException("El email ya esta en uso");
        }
    }

    private void validateExistingUser(Long id, String username, String email) {
        if (userRepository.existsByUsernameAndIdNot(username, id)) {
            throw new ResponseStatusException(CONFLICT, "El username ya esta en uso");
        }
        if (userRepository.existsByEmailAndIdNot(email, id)) {
            throw new EmailAlreadyExistsException("El email ya esta en uso");
        }
    }

    private UserDTO toDto(User user) {
        return new UserDTO(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole(),
                user.getCreatedAt(),
                !Boolean.FALSE.equals(user.getEmailVerified())
        );
    }

    public void verifyEmail(String token) {
        emailTokenService.verify(token);
    }

    public void resendVerification(String email) {
        if (!emailEnabled) return;
        userRepository.findByEmail(email)
                .filter(user -> Boolean.FALSE.equals(user.getEmailVerified()))
                .ifPresent(user -> emailTokenService.sendVerification(user));
    }

    public void requestPasswordReset(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            if (emailEnabled) emailTokenService.sendPasswordReset(user);
        });
    }

    public void resetPassword(String token, String password) {
        emailTokenService.resetPassword(token, password, passwordEncoder);
    }
}
