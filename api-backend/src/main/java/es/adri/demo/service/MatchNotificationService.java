package es.adri.demo.service;

import es.adri.demo.model.Match;
import es.adri.demo.model.MatchPhase;
import es.adri.demo.model.MatchStatus;
import es.adri.demo.model.User;
import es.adri.demo.repository.CompetitionRepository;
import es.adri.demo.repository.MatchRepository;
import es.adri.demo.repository.UserRepository;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Avisos por email del horario de los partidos.
 * <p>
 * Un partido pasa a tener "horario confirmado" cuando esta programado, tiene una
 * hora real (distinta de las 00:00) y una sede. En ese momento se avisa a los
 * usuarios verificados una sola vez ({@link Match#getScheduleNotifiedAt()}).
 * El aviso se dispara tanto desde las ediciones manuales del admin como desde el
 * scraping, porque se llama desde {@link MatchService}. Si se envio mal, el admin
 * puede reenviarlo a mano.
 */
@Service
public class MatchNotificationService {

    private static final Logger log = LoggerFactory.getLogger(MatchNotificationService.class);
    private static final DateTimeFormatter DATE_TIME_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final MatchRepository matchRepository;
    private final CompetitionRepository competitionRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final AsyncEmailService asyncEmailService;
    private final EmailTemplateService templateService;

    @Value("${app.email.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    public MatchNotificationService(MatchRepository matchRepository,
                                    CompetitionRepository competitionRepository,
                                    UserRepository userRepository,
                                    EmailService emailService,
                                    AsyncEmailService asyncEmailService,
                                    EmailTemplateService templateService) {
        this.matchRepository = matchRepository;
        this.competitionRepository = competitionRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.asyncEmailService = asyncEmailService;
        this.templateService = templateService;
    }

    /** Asunto + cuerpo HTML del aviso de horario. */
    public record ScheduleMail(String subject, String html) {
    }

    /**
     * Un horario esta confirmado cuando el partido esta programado, la hora no es
     * 00:00 (la federacion usa 00:00 cuando aun no ha fijado hora) y hay sede.
     */
    public static boolean isScheduleConfirmed(Match match) {
        return match != null && match.getStatus() == MatchStatus.SCHEDULED && hasConfirmedSchedule(match);
    }

    public static boolean hasConfirmedSchedule(Match match) {
        if (match == null) {
            return false;
        }
        if (match.getDate() == null || match.getDate().toLocalTime().equals(LocalTime.MIDNIGHT)) {
            return false;
        }
        return match.getLocation() != null && !match.getLocation().isBlank();
    }

    /**
     * Envia el aviso si el horario acaba de quedar confirmado y aun no se aviso.
     * Es idempotente: en ediciones posteriores (manuales o del scraping) no reenvia.
     */
    @Transactional
    public void notifyIfConfirmed(Match match) {
        if (match == null || match.getScheduleNotifiedAt() != null || !isScheduleConfirmed(match)) {
            return;
        }
        if (!emailService.isEnabled()) {
            return;
        }
        sendToVerifiedUsers(match);
        match.setScheduleNotifiedAt(LocalDateTime.now());
        matchRepository.save(match);
    }

    /** Reenvio manual del aviso de horario de un partido (ignora el flag). */
    @Transactional
    public int resend(Long matchId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Partido no encontrado"));
        if (!emailService.isEnabled()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "El envio de correos esta desactivado (EMAIL_ENABLED=false)");
        }
        if (!hasConfirmedSchedule(match)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "El partido no tiene horario confirmado (hora distinta de 00:00 y sede)");
        }
        int recipients = sendToVerifiedUsers(match);
        if (match.getScheduleNotifiedAt() == null) {
            match.setScheduleNotifiedAt(LocalDateTime.now());
            matchRepository.save(match);
        }
        return recipients;
    }

    private int sendToVerifiedUsers(Match match) {
        ScheduleMail mail = buildScheduleMail(match);
        List<User> users = userRepository.findByEmailVerifiedTrue();
        for (User user : users) {
            asyncEmailService.sendWithRetry(user.getEmail(), mail.subject(), mail.html());
        }
        log.info("Aviso de horario enviado a {} usuarios (partido id={}, rival={})",
                users.size(), match.getId(), match.getRival());
        return users.size();
    }

    /** HTML del aviso para un partido concreto. */
    public ScheduleMail buildScheduleMail(Match match) {
        String rival = match.getRival() == null ? "" : match.getRival();
        String competitionName = match.getCompetition() == null ? null : match.getCompetition().getName();
        String subject = "Horario confirmado: Real Lisiados vs " + rival;
        String dateStr = match.getDate() == null ? "Fecha por confirmar" : match.getDate().format(DATE_TIME_FORMAT);
        String inner = "<p>Hola, ya tenemos confirmado el horario del pr&oacute;ximo partido. Te esperamos en la grada.</p>"
                + templateService.infoCard(
                        templateService.matchRow("Partido", "Real Lisiados vs " + escapeHtml(rival))
                                + templateService.matchRow("Fecha", escapeHtml(dateStr))
                                + (match.getLocation() == null ? ""
                                        : templateService.matchRow("Sede", escapeHtml(match.getLocation())))
                                + (match.getJornada() == null ? ""
                                        : templateService.matchRow("Jornada", "Jornada " + match.getJornada()))
                                + (match.getPhase() == null ? ""
                                        : templateService.matchRow("Fase", phaseLabel(match.getPhase())))
                                + (match.getGroupName() == null || match.getGroupName().isBlank() ? ""
                                        : templateService.matchRow("Grupo", escapeHtml(match.getGroupName())))
                                + (competitionName == null || competitionName.isBlank() ? ""
                                        : templateService.matchRow("Competici\u00f3n", escapeHtml(competitionName))));
        String html = templateService.scheduleWrapper(subject, inner,
                "Ver calendario", frontendUrl + "/calendario",
                "Recibes este aviso por tener la cuenta verificada.");
        return new ScheduleMail(subject, html);
    }

    /** HTML de ejemplo para la vista previa del panel admin (sin enviar nada). */
    @Transactional(readOnly = true)
    public ScheduleMail buildEmailPreview(Long competitionId) {
        Match match = findNextScheduledMatch(competitionId).orElseGet(() -> {
            Match example = new Match();
            example.setRival("CD Ejemplo");
            example.setDate(LocalDateTime.now().plusDays(6).withHour(17).withMinute(30));
            example.setLocation("Polideportivo Municipal");
            example.setJornada(12);
            example.setStatus(MatchStatus.SCHEDULED);
            return example;
        });
        if (match.getCompetition() == null && competitionId != null) {
            competitionRepository.findById(competitionId).ifPresent(match::setCompetition);
        }
        return buildScheduleMail(match);
    }

    /**
     * Envia a una unica direccion el aviso del proximo partido de una competicion.
     * Para probar la configuracion desde el panel admin sin spamear a los usuarios.
     */
    @Transactional(readOnly = true)
    public void sendNextMatchPreview(Long competitionId, String recipient) {
        if (!emailService.isEnabled()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "El envio de correos esta desactivado (EMAIL_ENABLED=false)");
        }
        Match next = findNextScheduledMatch(competitionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No hay proximo partido programado para esta competicion"));
        ScheduleMail mail = buildScheduleMail(next);
        emailService.send(recipient, "[PRUEBA] " + mail.subject(), mail.html());
    }

    private Optional<Match> findNextScheduledMatch(Long competitionId) {
        return matchRepository.findFirstByCompetitionIdAndStatusAndDateGreaterThanEqualOrderByDateAsc(
                competitionId, MatchStatus.SCHEDULED, LocalDateTime.now());
    }

    private static String phaseLabel(MatchPhase phase) {
        return switch (phase) {
            case LIGUILLA -> "Liguilla";
            case DIECISEISAVOS -> "Dieciseisavos";
            case OCTAVOS -> "Octavos";
            case CUARTOS -> "Cuartos";
            case SEMIFINAL -> "Semifinal";
            case FINAL -> "Final";
        };
    }

    private static String escapeHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
