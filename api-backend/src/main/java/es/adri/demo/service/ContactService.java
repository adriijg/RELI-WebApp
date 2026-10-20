package es.adri.demo.service;

import es.adri.demo.dto.ContactMessageDTO;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ContactService {

    private static final Logger log = LoggerFactory.getLogger(ContactService.class);
    private static final Duration COOLDOWN = Duration.ofSeconds(45);
    private static final int MAX_TRACKED_IPS = 2_000;

    private final AsyncEmailService asyncEmailService;
    private final EmailTemplateService emailTemplateService;
    private final Map<String, Instant> lastRequestByIp = new ConcurrentHashMap<>();

    @Value("${app.contact.recipient:}")
    private String contactRecipient;

    @Value("${app.email.from:}")
    private String emailFrom;

    @Value("${app.email.enabled:false}")
    private boolean emailEnabled;

    public ContactService(AsyncEmailService asyncEmailService, EmailTemplateService emailTemplateService) {
        this.asyncEmailService = asyncEmailService;
        this.emailTemplateService = emailTemplateService;
    }

    public void send(ContactMessageDTO message, String clientIp) {
        if (message.getWebsite() != null && !message.getWebsite().isBlank()) {
            log.info("Mensaje de contacto descartado por honeypot");
            return;
        }

        if (!emailEnabled) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "El formulario no esta disponible ahora mismo. Escribenos directamente por email.");
        }

        String recipient = firstNonBlank(contactRecipient, emailFrom);
        if (recipient == null) {
            log.error("Formulario de contacto sin destinatario configurado (app.contact.recipient / app.email.from)");
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "El formulario no esta disponible ahora mismo. Escribenos directamente por email.");
        }

        enforceCooldown(clientIp);

        String name = message.getName().trim();
        String email = message.getEmail().trim();
        String subject = "Web RELI - Mensaje de " + name;
        String html = emailTemplateService.contactMessage(name, email, message.getMessage().trim());
        asyncEmailService.sendWithRetry(recipient, subject, html, email);
    }

    private void enforceCooldown(String clientIp) {
        String key = (clientIp == null || clientIp.isBlank()) ? "unknown" : clientIp;
        Instant now = Instant.now();

        if (lastRequestByIp.size() > MAX_TRACKED_IPS) {
            lastRequestByIp.entrySet().removeIf(entry -> Duration.between(entry.getValue(), now).compareTo(COOLDOWN) > 0);
        }

        Instant previous = lastRequestByIp.put(key, now);
        if (previous != null && Duration.between(previous, now).compareTo(COOLDOWN) < 0) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Espera un momento antes de enviar otro mensaje.");
        }
    }

    private static String firstNonBlank(String first, String second) {
        if (first != null && !first.isBlank()) return first.trim();
        if (second != null && !second.isBlank()) return second.trim();
        return null;
    }
}
