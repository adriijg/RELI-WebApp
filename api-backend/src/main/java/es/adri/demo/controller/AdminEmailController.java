package es.adri.demo.controller;

import es.adri.demo.dto.EmailStatusDTO;
import es.adri.demo.dto.EmailTestRequestDTO;
import es.adri.demo.service.FfmSyncService;
import es.adri.demo.service.EmailService;
import es.adri.demo.service.EmailTemplateService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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
 * configuración SMTP (Gmail) y enviar correos de prueba sin spamear
 * a todos los usuarios.
 */
@RestController
@RequestMapping("/api/admin/emails")
@PreAuthorize("hasRole('ADMIN')")
public class AdminEmailController {

    private final EmailService emailService;
    private final FfmSyncService ffmSyncService;
    private final EmailTemplateService templateService;

    @Value("${app.email.enabled:false}")
    private boolean emailEnabled;

    @Value("${spring.mail.username:}")
    private String smtpUser;

    @Value("${spring.mail.password:}")
    private String smtpPassword;

    @Value("${app.email.from:}")
    private String from;

    @Value("${app.email.frontend-url:}")
    private String frontendUrl;

    public AdminEmailController(EmailService emailService, FfmSyncService ffmSyncService,
                                EmailTemplateService templateService) {
        this.emailService = emailService;
        this.ffmSyncService = ffmSyncService;
        this.templateService = templateService;
    }

    @GetMapping("/status")
    public ResponseEntity<EmailStatusDTO> status() {
        boolean smtpConfigured = smtpUser != null && !smtpUser.isBlank()
                && smtpPassword != null && !smtpPassword.isBlank();
        return ResponseEntity.ok(new EmailStatusDTO(
                emailEnabled,
                smtpConfigured,
                from,
                from != null && !from.isBlank(),
                frontendUrl));
    }

    @PostMapping("/test")
    public ResponseEntity<String> sendTest(@Valid @RequestBody EmailTestRequestDTO request) {
        checkEnabled();
        emailService.send(request.getTo(), "Correo de prueba RELI", templateService.testMail());
        return ResponseEntity.ok("Correo de prueba enviado a " + request.getTo());
    }

    @PostMapping("/next-match-test")
    public ResponseEntity<String> sendNextMatchTest(
            @RequestParam Long competitionId,
            @Valid @RequestBody EmailTestRequestDTO request) {
        ffmSyncService.sendNextMatchPreview(competitionId, request.getTo());
        return ResponseEntity.ok("Aviso de prueba del próximo partido enviado a " + request.getTo());
    }

    /**
     * Vista previa de la plantilla sin enviar nada.
     * type: test | verify | reset | match
     */
    @GetMapping(value = "/preview", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> preview(
            @RequestParam(defaultValue = "test") String type,
            @RequestParam(required = false) Long competitionId) {
        String html = switch (type) {
            case "verify" -> templateService.verification("Aficionado", frontendUrl + "?verifyEmail=PREVIEW");
            case "reset" -> templateService.passwordReset(frontendUrl + "?resetPassword=PREVIEW");
            case "match" -> {
                if (competitionId != null) yield ffmSyncService.buildEmailPreview(competitionId).html();
                yield templateService.scheduleWrapper("Próximo partido: Real Lisiados vs CD Ejemplo",
                        "<p>Hola, este es el pr&oacute;ximo compromiso del equipo. Te esperamos en la grada.</p>"
                                + templateService.infoCard(
                                        templateService.matchRow("Partido", "Real Lisiados vs CD Ejemplo")
                                                + templateService.matchRow("Fecha", "15-02-2026 17:30")
                                                + templateService.matchRow("Sede", "Polideportivo Municipal")
                                                + templateService.matchRow("Jornada", "Jornada 12")
                                                + templateService.matchRow("Competición", "Liga Municipal")),
                        "Ver calendario", frontendUrl + "/calendario",
                        "Vista previa sin enviar. Elige una competici\u00f3n para ver datos reales.");
            }
            default -> templateService.testMail();
        };
        return ResponseEntity.ok().contentType(MediaType.TEXT_HTML).body(templateService.withPreviewLogo(html));
    }

    private void checkEnabled() {
        if (!emailService.isEnabled()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "El envío de correos está desactivado (EMAIL_ENABLED=false)");
        }
    }
}
