package es.adri.demo.service;

import es.adri.demo.model.Competition;
import es.adri.demo.model.Match;
import es.adri.demo.repository.MatchRepository;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Importa el acta de UN partido concreto desde la federacion (FFM/Novanet).
 * Una sola sesion de scraping por partido (el script Python descubre el codacta
 * de nuestro partido en su jornada y descarga solo esa acta).
 *
 * No hay scraping masivo de plantilla ni de todas las actas de la temporada:
 * los jugadores ya estan en la BD y reimportar toda la temporada bloquea la IP.
 */
@Service
public class RosterScrapeService {

    private static final String[] SCRIPT_CANDIDATES = {
            "scripts/ffmadrid_acta_import.py",
            "../scripts/ffmadrid_acta_import.py",
    };

    private final MatchRepository matchRepository;

    @Value("${app.ffm.user:}")
    private String ffmUser;
    @Value("${app.ffm.password:}")
    private String ffmPassword;
    @Value("${app.bootstrap-admin.username:admin}")
    private String adminUsername;
    @Value("${app.bootstrap-admin.password:}")
    private String adminPassword;
    @Value("${server.port:8080}")
    private String serverPort;

    public RosterScrapeService(MatchRepository matchRepository) {
        this.matchRepository = matchRepository;
    }

    @Transactional(readOnly = true)
    public es.adri.demo.dto.StatsScrapeResultDTO importMatchActa(Long matchId) {
        Match match = matchRepository.findWithCompetitionById(matchId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Partido no encontrado"));
        Competition comp = match.getCompetition();
        if (comp == null || comp.getFfmCompeticion() == null || comp.getFfmTemporada() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El partido no tiene competición con configuración FFM");
        }
        if (match.getJornada() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El partido no tiene jornada");
        }
        checkCredentials();
        String script = resolveScript();
        try {
            ProcessBuilder pb = new ProcessBuilder(
                    "python", script,
                    "--match-id", String.valueOf(matchId),
                    "--competition-id", String.valueOf(comp.getId()),
                    "--api", "http://localhost:" + serverPort + "/api",
                    "--admin-user", adminUsername,
                    "--apply",
                    "--ffm-competicion", comp.getFfmCompeticion().trim(),
                    "--ffm-grupo", comp.getFfmGrupo() == null ? "" : comp.getFfmGrupo().trim(),
                    "--ffm-temporada", comp.getFfmTemporada().trim(),
                    "--ffm-our-code", comp.getFfmOurCode() == null ? "" : comp.getFfmOurCode().trim());
            Map<String, String> env = pb.environment();
            env.put("FFM_USER", ffmUser);
            env.put("FFM_PASS", ffmPassword);
            env.put("ADMIN_USERNAME", adminUsername);
            env.put("ADMIN_PASSWORD", adminPassword);
            pb.redirectErrorStream(true);
            Process proc = pb.start();
            String out = new String(proc.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            int exit = proc.waitFor();
            if (exit != 0) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        "No se pudo importar el acta: " + lastLines(out));
            }
            int stats = 0;
            int statsUpd = 0;
            int goals = 0;
            Matcher m = Pattern.compile("stats.:\\s*(\\d+).*stats_updated.:\\s*(\\d+)", Pattern.CASE_INSENSITIVE).matcher(out);
            if (m.find()) {
                stats = Integer.parseInt(m.group(1));
                statsUpd = Integer.parseInt(m.group(2));
            }
            Matcher g = Pattern.compile("goals.:\\s*(\\d+)", Pattern.CASE_INSENSITIVE).matcher(out);
            if (g.find()) goals = Integer.parseInt(g.group(1));
            String message = "Acta de J" + match.getJornada() + " importada: "
                    + stats + " stats nuevos / " + statsUpd + " actualizados, " + goals + " goles";
            return new es.adri.demo.dto.StatsScrapeResultDTO(1, 0, goals, stats, statsUpd, 0, message);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Fallo al importar el acta: " + e.getMessage());
        }
    }

    private String resolveScript() {
        for (String candidate : SCRIPT_CANDIDATES) {
            if (Files.exists(Paths.get(candidate))) return candidate;
        }
        return SCRIPT_CANDIDATES[0];
    }

    private static String lastLines(String out) {
        if (out == null || out.isBlank()) return "sin detalle";
        List<String> lines = out.lines().filter(l -> !l.isBlank()).toList();
        int from = Math.max(0, lines.size() - 3);
        return String.join(" | ", lines.subList(from, lines.size()));
    }

    private void checkCredentials() {
        if (ffmUser == null || ffmUser.isBlank() || ffmPassword == null || ffmPassword.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Faltan credenciales FFM (FFM_USER / FFM_PASS)");
        }
        if (adminUsername == null || adminUsername.isBlank() || adminPassword == null || adminPassword.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Faltan credenciales del admin (ADMIN_USERNAME / ADMIN_PASSWORD)");
        }
    }
}
