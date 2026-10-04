package es.adri.demo.service;

import es.adri.demo.dto.RoundActaDTO;
import es.adri.demo.model.Competition;
import es.adri.demo.repository.CompetitionRepository;
import java.net.CookieManager;
import java.net.CookiePolicy;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * Scrapeo mínimo y educado de actas: solo UNA jornada bajo demanda.
 *
 * A diferencia del scrapeo de temporada (cientos de peticiones en ráfaga),
 * esto son ~3 peticiones para listar + 2 por acta, con pausas entre ellas,
 * cabeceras de navegador real y un cerrojo global para no solapar trabajos.
 * Aun así, si la federación está limitando nuestra IP responderá 403/429 y
 * aquí se surfacea como 503 con mensaje claro (esperar y reintentar).
 */
@Service
public class FfmActaService {

    private static final Logger log = LoggerFactory.getLogger(FfmActaService.class);

    private static final String BROWSER_UA =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
    private static final Pattern RE_CODACTA =
            Pattern.compile("NFG_CmpPartido\\?cod_primaria=\\d+&CodActa=(\\d+)&cod_acta=\\d+", Pattern.CASE_INSENSITIVE);
    private static final Pattern RE_EQUIPOS =
            Pattern.compile("<span class=\"tituloprograma\">\\s*(.*?)\\s*</span>", Pattern.DOTALL);
    private static final Pattern RE_ROUND_OPT =
            Pattern.compile("<option[^>]*value=\"(\\d+)\"[^>]*>\\s*\\d+\\s*-\\s*(\\d{2}-\\d{2}-\\d{4})");

    /** Pausa mínima entre peticiones a la federación (también entre operaciones). */
    private static final long MIN_GAP_MS = 2500;

    private final CompetitionRepository competitionRepository;

    @Value("${app.ffm.base-url:https://parla.ffmadrid.es}")
    private String baseUrl;
    @Value("${app.ffm.user:}")
    private String ffmUser;
    @Value("${app.ffm.password:}")
    private String ffmPassword;
    @Value("${app.ffm.cod-primaria:1000128}")
    private String codPrimaria;
    @Value("${app.ffm.cod-agrupacion:1}")
    private String codAgrupacion;
    @Value("${app.ffm.tipo-juego:3}")
    private String tipoJuego;

    private final Object ffmLock = new Object();
    private long lastFfmCall = 0;

    public FfmActaService(CompetitionRepository competitionRepository) {
        this.competitionRepository = competitionRepository;
    }

    /** Lista los partidos de una jornada con su CodActa (si hay acta publicada). Solo ~3 peticiones. */
    public List<RoundActaDTO> listRoundActas(Long competitionId, int jornada) {
        Competition competition = competitionRepository.findById(competitionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Competición no encontrada"));
        if (competition.getFfmCompeticion() == null || competition.getFfmCompeticion().isBlank()
                || competition.getFfmGrupo() == null || competition.getFfmGrupo().isBlank()
                || competition.getFfmTemporada() == null || competition.getFfmTemporada().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La competición no tiene configuración FFM");
        }
        checkCredentials();
        synchronized (ffmLock) {
            try {
                HttpClient client = newClient();
                login(client);
                String html = fetchJornada(client, competition, jornada);
                String ourCode = competition.getFfmOurCode() == null || competition.getFfmOurCode().isBlank()
                        ? "320143" : competition.getFfmOurCode().trim();
                List<FfmSyncService.FfmMatch> parsed = FfmSyncService.parseJornada(html, jornada, ourCode);
                List<String> codactas = extractCodactas(html);
                if (!codactas.isEmpty() && codactas.size() != parsed.size()) {
                    log.warn("Actas de J{}: {} partidos pero {} codactas (emparejado posicional parcial)",
                            jornada, parsed.size(), codactas.size());
                }
                List<RoundActaDTO> out = new ArrayList<>();
                for (int i = 0; i < parsed.size(); i++) {
                    FfmSyncService.FfmMatch match = parsed.get(i);
                    out.add(new RoundActaDTO(
                            match.jornada(),
                            match.homeName(), match.awayName(),
                            match.homeCode(), match.awayCode(),
                            match.date() == null ? null : match.date().toString(),
                            match.venue(), match.homeGoals(), match.awayGoals(),
                            match.wePlay(),
                            i < codactas.size() ? codactas.get(i) : null));
                }
                return out;
            } catch (ResponseStatusException e) {
                throw e;
            } catch (Exception e) {
                throw toGateway(e);
            }
        }
    }

    /** Descarga el HTML del acta y verifica que sea del partido esperado (si se indica). */
    public String fetchActaHtml(String codacta, String expectedHome, String expectedAway) {
        checkCredentials();
        if (codacta == null || !codacta.matches("\\d+")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CodActa no válido");
        }
        synchronized (ffmLock) {
            try {
                HttpClient client = newClient();
                login(client);
                String html = fetchActa(client, codacta);
                if (expectedHome != null && !expectedHome.isBlank()
                        && expectedAway != null && !expectedAway.isBlank()) {
                    List<String> teams = actaTeams(html);
                    String wantHome = norm(expectedHome);
                    String wantAway = norm(expectedAway);
                    boolean ok = teams.size() >= 2
                            && ((teams.get(0).contains(wantHome) || wantHome.contains(teams.get(0)))
                                    && (teams.get(1).contains(wantAway) || wantAway.contains(teams.get(1)))
                            || ((teams.get(0).contains(wantAway) || wantAway.contains(teams.get(0)))
                                    && (teams.get(1).contains(wantHome) || wantHome.contains(teams.get(1)))));
                    if (!ok) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT,
                                "El acta " + codacta + " no parece ser de ese partido (" + String.join(" / ", teams) + ")");
                    }
                }
                return html;
            } catch (ResponseStatusException e) {
                throw e;
            } catch (Exception e) {
                throw toGateway(e);
            }
        }
    }

    /** Descarga el PDF de alineaciones/resultados del acta. */
    public byte[] fetchActaPdf(String codacta) {
        checkCredentials();
        if (codacta == null || !codacta.matches("\\d+")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CodActa no válido");
        }
        synchronized (ffmLock) {
            try {
                HttpClient client = newClient();
                login(client);
                String url = baseUrl + "/nfg/NPcd/NFG_CMP_Alineacion_Resultados?cod_primaria=" + urlEncode(codPrimaria)
                        + "&codacta=" + codacta + "&NPcd_Pdf=1";
                HttpResponse<byte[]> response = send(client, url);
                if (response.statusCode() != 200) {
                    throw new IllegalStateException("La federación devolvió HTTP " + response.statusCode());
                }
                String contentType = response.headers().firstValue("Content-Type").orElse("");
                if (!contentType.contains("pdf") && response.body().length < 1000) {
                    throw new IllegalStateException("La federación no devolvió un PDF (¿sesión caducada?)");
                }
                return response.body();
            } catch (ResponseStatusException e) {
                throw e;
            } catch (Exception e) {
                throw toGateway(e);
            }
        }
    }

    // ---------- HTTP educado ----------

    private HttpClient newClient() {
        return HttpClient.newBuilder()
                .cookieHandler(new CookieManager(null, CookiePolicy.ACCEPT_ALL))
                .followRedirects(HttpClient.Redirect.NEVER)
                .connectTimeout(Duration.ofSeconds(30))
                .build();
    }

    private HttpRequest.Builder baseRequest(String url, String referer) {
        HttpRequest.Builder builder = HttpRequest.newBuilder(URI.create(url))
                .timeout(Duration.ofSeconds(30))
                .header("User-Agent", BROWSER_UA)
                .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/*,*/*;q=0.8")
                .header("Accept-Language", "es-ES,es;q=0.9");
        if (referer != null) builder.header("Referer", referer);
        return builder;
    }

    /** Una petición, con pausa de cortesía antes para no aporrear a la federación. */
    private HttpResponse<byte[]> send(HttpClient client, String url) throws Exception {
        politePause();
        HttpResponse<byte[]> response = client.send(
                baseRequest(url, baseUrl + "/").GET().build(),
                HttpResponse.BodyHandlers.ofByteArray());
        if (response.statusCode() == 403 || response.statusCode() == 429) {
            throw new IllegalStateException(
                    "La federación está limitando las peticiones desde nuestra IP (HTTP " + response.statusCode() + "). "
                            + "Espera unos minutos y reintenta; si persiste, prueba con datos del móvil.");
        }
        return response;
    }

    private void politePause() {
        long wait;
        synchronized (ffmLock) {
            // Pequeña espera aleatoria para no parecer un robot con cadencia fija
            long jitter = 500 + (long) (Math.random() * 1500);
            wait = Math.max(0, (lastFfmCall + MIN_GAP_MS + jitter) - System.currentTimeMillis());
        }
        if (wait > 0) {
            try {
                Thread.sleep(wait);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
        synchronized (ffmLock) {
            lastFfmCall = System.currentTimeMillis();
        }
    }

    private void login(HttpClient client) throws Exception {
        checkCredentials();
        String body = "NUser=" + urlEncode(ffmUser) + "&NPass=" + urlEncode(ffmPassword) + "&LoginAjax=1";
        politePause();
        HttpResponse<String> login = client.send(
                baseRequest(baseUrl + "/nfg/NLogin", baseUrl + "/").header("Content-Type", "application/x-www-form-urlencoded")
                        .POST(HttpRequest.BodyPublishers.ofString(body)).build(),
                HttpResponse.BodyHandlers.ofString());
        if (login.statusCode() == 403 || login.statusCode() == 429) {
            throw new IllegalStateException(
                    "La federación está limitando las peticiones desde nuestra IP (HTTP " + login.statusCode() + "). "
                            + "Espera unos minutos y reintenta; si persiste, prueba con datos del móvil.");
        }
        String location = login.headers().firstValue("Location").orElse("");
        if (login.statusCode() != 302 || !location.contains("NLogin")) {
            throw new IllegalStateException("Login inesperado en la federación: HTTP " + login.statusCode());
        }
        politePause();
        HttpResponse<String> session = client.send(
                baseRequest(baseUrl + location, baseUrl + "/nfg/NLogin").GET().build(),
                HttpResponse.BodyHandlers.ofString());
        if (!session.body().contains("estado=\"1\"") && !session.body().contains("estado='1'")) {
            throw new IllegalStateException("Login rechazado por la federación (revisa FFM_USER / FFM_PASS)");
        }
    }

    private String fetchJornada(HttpClient client, Competition competition, int round) throws Exception {
        String url = baseUrl + "/nfg/NPcd/NFG_CmpJornada"
                + "?cod_primaria=" + urlEncode(codPrimaria)
                + "&CodCompeticion=" + urlEncode(competition.getFfmCompeticion().trim())
                + "&CodGrupo=" + urlEncode(competition.getFfmGrupo().trim())
                + "&CodTemporada=" + urlEncode(competition.getFfmTemporada().trim())
                + "&CodJornada=" + round
                + "&cod_agrupacion=" + urlEncode(codAgrupacion)
                + "&Sch_Tipo_Juego=" + urlEncode(tipoJuego);
        HttpResponse<byte[]> response = send(client, url);
        if (response.statusCode() != 200) {
            throw new IllegalStateException("La federación devolvió HTTP " + response.statusCode());
        }
        String html = FfmSyncService.decode(response.body());
        if (html.length() > 2000 && html.substring(0, 2000).contains("<title>Novanet | Login")) {
            throw new IllegalStateException("Sesión caducada en la federación");
        }
        return html;
    }

    private String fetchActa(HttpClient client, String codacta) throws Exception {
        String url = baseUrl + "/nfg/NPcd/NFG_CmpPartido?cod_primaria=" + urlEncode(codPrimaria)
                + "&CodActa=" + codacta + "&cod_acta=" + codacta;
        HttpResponse<byte[]> response = send(client, url);
        if (response.statusCode() != 200) {
            throw new IllegalStateException("La federación devolvió HTTP " + response.statusCode());
        }
        try {
            return new String(response.body(), java.nio.charset.Charset.forName("iso-8859-15"));
        } catch (Exception e) {
            return new String(response.body(), java.nio.charset.Charset.forName("windows-1252"));
        }
    }

    private void checkCredentials() {
        if (ffmUser == null || ffmUser.isBlank() || ffmPassword == null || ffmPassword.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Faltan las credenciales FFM en el servidor (FFM_USER / FFM_PASS)");
        }
    }

    private ResponseStatusException toGateway(Exception e) {
        String message = e.getMessage() == null ? e.toString() : e.getMessage();
        if (message.contains("limitando") || message.contains("Login rechazado") || message.contains("Sesión caducada")) {
            return new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, message);
        }
        return new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Fallo al leer la federación: " + message);
    }

    private List<String> extractCodactas(String html) {
        Matcher matcher = RE_CODACTA.matcher(html);
        LinkedHashSet<String> out = new LinkedHashSet<>();
        while (matcher.find()) out.add(matcher.group(1));
        return new ArrayList<>(out);
    }

    private List<String> actaTeams(String html) {
        Matcher matcher = RE_EQUIPOS.matcher(html);
        List<String> out = new ArrayList<>();
        while (matcher.find()) {
            String team = norm(clean(matcher.group(1)));
            if (!team.isBlank()) out.add(team);
            if (out.size() >= 2) break;
        }
        return out;
    }

    private static String clean(String s) {
        if (s == null) return "";
        s = s.replaceAll("<[^>]+>", " ").replaceAll("&nbsp;", " ").replaceAll("\\s+", " ").trim();
        return s.replaceAll("&amp;", "&");
    }

    static String norm(String name) {
        if (name == null) return "";
        String decomposed = Normalizer.normalize(name, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        return decomposed.toUpperCase().replaceAll("[^A-Z0-9 ]", " ").replaceAll("\\s+", " ").trim();
    }

    private String urlEncode(String value) {
        return URLEncoder.encode(value == null ? "" : value, StandardCharsets.UTF_8);
    }

    /** Jornadas disponibles según el desplegable de la primera página (para validar). */
    public List<Integer> availableRounds(Long competitionId) {
        Competition competition = competitionRepository.findById(competitionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Competición no encontrada"));
        checkCredentials();
        synchronized (ffmLock) {
            try {
                HttpClient client = newClient();
                login(client);
                String html = fetchJornada(client, competition, 1);
                Matcher matcher = RE_ROUND_OPT.matcher(html);
                Set<Integer> rounds = new TreeSet<>();
                while (matcher.find()) rounds.add(Integer.parseInt(matcher.group(1)));
                return new ArrayList<>(rounds);
            } catch (ResponseStatusException e) {
                throw e;
            } catch (Exception e) {
                throw toGateway(e);
            }
        }
    }
}
