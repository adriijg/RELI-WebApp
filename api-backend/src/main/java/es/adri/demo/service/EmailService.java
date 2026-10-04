package es.adri.demo.service;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    /** Content-ID usado en la plantilla (<img src="cid:reliBadge">). */
    public static final String LOGO_CID = "reliBadge";

    private final JavaMailSender mailSender;

    @Value("${app.email.enabled:false}")
    private boolean enabled;

    @Value("${app.email.from:}")
    private String from;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void send(String recipient, String subject, String html) {
        if (!enabled) return;
        if (from == null || from.isBlank()) {
            throw new IllegalStateException("Email activado pero falta app.email.from");
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(recipient);
            helper.setSubject(subject);
            helper.setText(html, true);
            // Escudo incrustado: viaja con el correo, no depende de URL externa.
            try {
                ClassPathResource logo = new ClassPathResource("email/reli-badge-email.png");
                if (logo.exists()) {
                    helper.addInline(LOGO_CID, logo, "image/png");
                }
            } catch (Exception e) {
                log.warn("No se pudo adjuntar el escudo al correo, se envía sin logo", e);
            }
            mailSender.send(message);
        } catch (Exception e) {
            throw new IllegalStateException("Error enviando email: " + e.getMessage(), e);
        }
    }
}
