package es.adri.demo.service;

import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class ResendEmailService {

    private final RestClient resendClient;

    @Value("${app.email.enabled:false}")
    private boolean enabled;

    @Value("${app.email.api-key:}")
    private String apiKey;

    @Value("${app.email.from:no-reply@example.com}")
    private String from;

    public ResendEmailService(RestClient resendClient) {
        this.resendClient = resendClient;
    }

    public void send(String recipient, String subject, String html) {
        if (!enabled) return;
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("Resend está activado pero falta RESEND_API_KEY");
        }
        if (from == null || from.isBlank()) {
            throw new IllegalStateException("Resend está activado pero falta RESEND_FROM");
        }

        resendClient.post()
                .uri("/emails")
                .header("Authorization", "Bearer " + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of(
                        "from", from,
                        "to", List.of(recipient),
                        "subject", subject,
                        "html", html
                ))
                .retrieve()
                .toBodilessEntity();
    }
}
