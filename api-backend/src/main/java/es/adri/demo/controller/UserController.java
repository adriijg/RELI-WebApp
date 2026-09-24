package es.adri.demo.controller;

import es.adri.demo.dto.AuthResponseDTO;
import es.adri.demo.dto.LoginRequestDTO;
import es.adri.demo.dto.UserDTO;
import es.adri.demo.dto.UserRegistrationDTO;
import es.adri.demo.dto.UserUpdateDTO;
import es.adri.demo.dto.PasswordResetConfirmDTO;
import es.adri.demo.dto.PasswordResetRequestDTO;
import jakarta.validation.Valid;
import es.adri.demo.service.UserService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<UserDTO> registerUser(@Valid @RequestBody UserRegistrationDTO userRegistrationDTO) {
        UserDTO savedUser = userService.saveUser(userRegistrationDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedUser);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> loginUser(@Valid @RequestBody LoginRequestDTO loginRequestDTO) {
        return ResponseEntity.ok(userService.loginUser(loginRequestDTO));
    }

    @GetMapping("/verify-email")
    public ResponseEntity<String> verifyEmail(@org.springframework.web.bind.annotation.RequestParam String token) {
        userService.verifyEmail(token);
        return ResponseEntity.ok("Email confirmado correctamente");
    }

    @PostMapping("/verify-email/resend")
    public ResponseEntity<String> resendVerification(@Valid @RequestBody PasswordResetRequestDTO request) {
        userService.resendVerification(request.getEmail());
        return ResponseEntity.ok("Si la cuenta existe y necesita confirmación, recibirás un nuevo correo");
    }

    @PostMapping("/password-reset/request")
    public ResponseEntity<String> requestPasswordReset(@Valid @RequestBody PasswordResetRequestDTO request) {
        userService.requestPasswordReset(request.getEmail());
        return ResponseEntity.ok("Si el email existe, recibirás instrucciones para recuperar la contraseña");
    }

    @PostMapping("/password-reset/confirm")
    public ResponseEntity<String> confirmPasswordReset(@Valid @RequestBody PasswordResetConfirmDTO request) {
        userService.resetPassword(request.getToken(), request.getPassword());
        return ResponseEntity.ok("Contraseña actualizada correctamente");
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.findAllUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.findUserById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserDTO> updateUser(@PathVariable Long id, @Valid @RequestBody UserUpdateDTO userUpdateDTO) {
        return ResponseEntity.ok(userService.updateUser(id, userUpdateDTO));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
