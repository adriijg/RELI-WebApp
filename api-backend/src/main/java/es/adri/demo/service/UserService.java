package es.adri.demo.service;

import es.adri.demo.dto.AuthResponseDTO;
import es.adri.demo.dto.LoginRequestDTO;
import es.adri.demo.dto.UserDTO;
import es.adri.demo.dto.UserRegistrationDTO;
import es.adri.demo.dto.UserUpdateDTO;
import es.adri.demo.exception.EmailAlreadyExistsException;
import es.adri.demo.exception.ResourceNotFoundException;
import es.adri.demo.model.Role;
import es.adri.demo.model.User;
import es.adri.demo.repository.UserRepository;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public UserDTO saveUser(UserRegistrationDTO userRegistrationDTO) {
        validateNewUser(userRegistrationDTO.getUsername(), userRegistrationDTO.getEmail());

        User user = new User();
        user.setUsername(userRegistrationDTO.getUsername());
        user.setEmail(userRegistrationDTO.getEmail());
        user.setPassword(passwordEncoder.encode(userRegistrationDTO.getPassword()));
        user.setRole(Role.ROLE_USER);

        User savedUser = userRepository.save(user);
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

        return new AuthResponseDTO("Login correcto", toDto(user));
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
                user.getCreatedAt()
        );
    }
}
