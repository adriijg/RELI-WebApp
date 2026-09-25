package es.adri.demo.controller;

import es.adri.demo.dto.AuthResponseDTO;
import es.adri.demo.dto.GoogleAuthRequest;
import es.adri.demo.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class GoogleAuthController {

    private final UserService userService;

    public GoogleAuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/google")
    public ResponseEntity<AuthResponseDTO> googleLogin(@Valid @RequestBody GoogleAuthRequest request) {
        return ResponseEntity.ok(userService.googleLogin(request.getIdToken()));
    }
}
