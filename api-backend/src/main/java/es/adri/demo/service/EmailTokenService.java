package es.adri.demo.service;

import es.adri.demo.model.EmailToken;
import es.adri.demo.model.User;
import es.adri.demo.repository.EmailTokenRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@Service
public class EmailTokenService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final long TOKEN_HOURS = 24;

    private final EmailTokenRepository tokenRepository;
    private final ResendEmailService emailService;

    @Value("${app.email.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    public EmailTokenService(EmailTokenRepository tokenRepository, ResendEmailService emailService) {
        this.tokenRepository = tokenRepository;
        this.emailService = emailService;
    }

    @Transactional
    public void sendVerification(User user) {
        String token = createToken(user, EmailToken.Type.VERIFY_EMAIL);
        emailService.send(user.getEmail(), "Confirma tu email en RELI", """
                <h2>Bienvenido a RELI, %s</h2>
                <p>Confirma tu dirección de correo para activar tu cuenta:</p>
                <p><a href="%s?verifyEmail=%s">Confirmar email</a></p>
                <p>Este enlace caduca en 24 horas.</p>
                """.formatted(user.getUsername(), frontendUrl, token));
    }

    @Transactional
    public void verify(String rawToken) {
        EmailToken token = findValid(rawToken, EmailToken.Type.VERIFY_EMAIL);
        User user = token.getUser();
        user.setEmailVerified(true);
        token.setUsedAt(LocalDateTime.now());
        tokenRepository.save(token);
    }

    @Transactional
    public void sendPasswordReset(User user) {
        String token = createToken(user, EmailToken.Type.RESET_PASSWORD);
        emailService.send(user.getEmail(), "Recupera tu contraseña de RELI", """
                <h2>Recuperación de contraseña</h2>
                <p>Hemos recibido una solicitud para cambiar la contraseña de tu cuenta RELI.</p>
                <p><a href="%s?resetPassword=%s">Cambiar contraseña</a></p>
                <p>Si no lo has solicitado, ignora este mensaje. El enlace caduca en 1 hora.</p>
                """.formatted(frontendUrl, token));
    }

    @Transactional
    public void resetPassword(String rawToken, String encodedPassword, org.springframework.security.crypto.password.PasswordEncoder passwordEncoder) {
        EmailToken token = findValid(rawToken, EmailToken.Type.RESET_PASSWORD);
        User user = token.getUser();
        user.setPassword(passwordEncoder.encode(encodedPassword));
        token.setUsedAt(LocalDateTime.now());
        tokenRepository.save(token);
    }

    private String createToken(User user, EmailToken.Type type) {
        tokenRepository.deleteByUserAndType(user, type);
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        tokenRepository.save(new EmailToken(hash(raw), user, type,
                LocalDateTime.now().plusHours(type == EmailToken.Type.RESET_PASSWORD ? 1 : TOKEN_HOURS)));
        return raw;
    }

    private EmailToken findValid(String rawToken, EmailToken.Type type) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "Token no válido");
        }
        EmailToken token = tokenRepository.findByTokenHashAndType(hash(rawToken), type)
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "Token no válido o caducado"));
        if (token.getUsedAt() != null || token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(BAD_REQUEST, "Token no válido o caducado");
        }
        return token;
    }

    private static String hash(String raw) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 no disponible", e);
        }
    }
}
