package es.adri.demo.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Envio de correos en segundo plano con reintentos.
 * <p>
 * El envio SMTP puede tardar o fallar de forma puntual; hacerlo en el hilo de la
 * peticion (registro, sincronizacion...) bloquea al usuario y, si falla, el correo
 * se pierde silenciosamente. Aqui se lanza en un hilo aparte y se reintenta.
 */
@Service
public class AsyncEmailService {

    private static final Logger log = LoggerFactory.getLogger(AsyncEmailService.class);
    private static final int MAX_ATTEMPTS = 3;
    private static final long RETRY_DELAY_MS = 2_000;

    private final EmailService emailService;

    public AsyncEmailService(EmailService emailService) {
        this.emailService = emailService;
    }

    @Async
    public void sendWithRetry(String recipient, String subject, String html) {
        if (!emailService.isEnabled()) {
            return;
        }
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                emailService.send(recipient, subject, html);
                return;
            } catch (Exception e) {
                log.warn("Fallo enviando correo a {} (intento {}/{}): {}",
                        recipient, attempt, MAX_ATTEMPTS, e.getMessage());
                if (attempt < MAX_ATTEMPTS) {
                    sleep(RETRY_DELAY_MS);
                }
            }
        }
        log.error("No se pudo enviar el correo a {} tras {} intentos", recipient, MAX_ATTEMPTS);
    }

    private static void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
