package es.adri.demo.service;

import es.adri.demo.dto.AuthResponseDTO;
import es.adri.demo.config.JwtService;
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
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.security.crypto.password.PasswordEncoder;
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

    @org.springframework.beans.factory.annotation.Value("${app.email.enabled:false}")
    private boolean emailEnabled;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService,
                       EmailTokenService emailTokenService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.emailTokenService = emailTokenService;
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
