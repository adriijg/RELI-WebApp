package es.adri.demo.controller;

import es.adri.demo.dto.EmailStatusDTO;
import es.adri.demo.dto.EmailTestRequestDTO;
import es.adri.demo.service.FfmSyncService;
import es.adri.demo.service.ResendEmailService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Gestión de correos desde el panel admin: ver el estado de la
 * configuración de Resend y enviar correos de prueba sin spamear
 * a todos los usuarios.
 */
@RestController
@RequestMapping("/api/admin/emails")
@PreAuthorize("hasRole('ADMIN')")
public class AdminEmailController {

    private final ResendEmailService emailService;
    private final FfmSyncService ffmSyncService;

    @Value("${app.email.enabled:false}")
    private boolean emailEnabled;

    @Value("${app.email.api-key:}")
    private String apiKey;

    @Value("${app.email.from:}")
    private String from;

    @Value("${app.email.frontend-url:}")
    private String frontendUrl;

    public AdminEmailController(ResendEmailService emailService, FfmSyncService ffmSyncService) {
        this.emailService = emailService;
        this.ffmSyncService = ffmSyncService;
    }

    @GetMapping("/status")
    public ResponseEntity<EmailStatusDTO> status() {
        return ResponseEntity.ok(new EmailStatusDTO(
                emailEnabled,
                apiKey != null && !apiKey.isBlank(),
                from,
                from != null && !from.isBlank(),
                frontendUrl));
    }

    @PostMapping("/test")
    public ResponseEntity<String> sendTest(@Valid @RequestBody EmailTestRequestDTO request) {
        checkEnabled();
        emailService.send(request.getTo(), "Correo de prueba RELI", """
                <h2>RELI · Correo de prueba</h2>
                <p>Si recibes este mensaje, el envío de correos (Resend) está bien configurado.</p>
                """);
        return ResponseEntity.ok("Correo de prueba enviado a " + request.getTo());
    }

    @PostMapping("/next-match-test")
    public ResponseEntity<String> sendNextMatchTest(
            @RequestParam Long competitionId,
            @Valid @RequestBody EmailTestRequestDTO request) {
        ffmSyncService.sendNextMatchPreview(competitionId, request.getTo());
        return ResponseEntity.ok("Aviso de prueba del próximo partido enviado a " + request.getTo());
    }

    private void checkEnabled() {
        if (!emailService.isEnabled()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "El envío de correos está desactivado (EMAIL_ENABLED=false)");
        }
    }
}
