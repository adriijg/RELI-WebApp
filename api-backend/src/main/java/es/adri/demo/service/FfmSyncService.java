package es.adri.demo.service;

import es.adri.demo.dto.FfmSyncActionDTO;
import es.adri.demo.dto.FfmSyncResultDTO;
import es.adri.demo.dto.MatchRequestDTO;
import es.adri.demo.dto.MatchDTO;
import es.adri.demo.model.Competition;
import es.adri.demo.model.FfmSyncRun;
import es.adri.demo.model.Match;
import es.adri.demo.model.MatchStatus;
import es.adri.demo.repository.CompetitionRepository;
import es.adri.demo.repository.FfmSyncRunRepository;
import es.adri.demo.repository.MatchRepository;
import es.adri.demo.repository.UserRepository;
import java.net.CookieManager;
import java.net.CookiePolicy;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CharsetDecoder;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class FfmSyncService {

    private static final Logger log = LoggerFactory.getLogger(FfmSyncService.class);

    private static final DateTimeFormatter DATE_TIME_FORMAT = DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm");

    private static final Pattern RE_TEAMS = Pattern.compile(
            "NFG_VisEquipos\\?cod_primaria=\\d+&Codigo_Equipo=(\\d+)[^>]*>\\s*([^<]+?)\\s*</a>");
    private static final Pattern RE_COMP = Pattern.compile("equipo1=(\\d+)&equipo2=(\\d+)");
    private static final Pattern RE_DATES = Pattern.compile("fa-clock-o[^>]*></i>\\s*(\\d{2}-\\d{2}-\\d{4})");
    private static final Pattern RE_TIMES = Pattern.compile("esconder\">\\s*(\\d{2}:\\d{2})");
    private static final Pattern RE_CAMPO = Pattern.compile("Campo:</b></span>\\s*([^<]+?)\\s*(?:<|$)");
    private static final Pattern RE_ROUND_OPT =
            Pattern.compile("<option[^>]*value=\"(\\d+)\"[^>]*>\\s*\\d+\\s*-\\s*(\\d{2}-\\d{2}-\\d{4})");
    private static final Pattern RE_SCORE = Pattern.compile("(?<!\\d)(\\d{1,2})\\s*-\\s*(\\d{1,2})(?!\\d)");
    private static final Pattern RE_SELECT = Pattern.compile("<select.*?</select>", Pattern.DOTALL | Pattern.CASE_INSENSITIVE);
    private static final Pattern RE_TAG = Pattern.compile("<[^>]+>");
    private static final Pattern RE_DATE = Pattern.compile("\\d{2}-\\d{2}-\\d{4}");
    private static final Pattern RE_TIME = Pattern.compile("\\d{2}:\\d{2}");

    private static final Set<String> UPPER_TOKENS = Set.of(
            "FS", "F.S", "CD", "AD", "UD", "CF", "FF", "CE", "AT", "SD", "FC", "AC");
    private static final Set<String> LOWER_TOKENS = Set.of(
            "de", "del", "la", "el", "los", "las", "y", "e", "al");

    private final CompetitionRepository competitionRepository;
    private final MatchRepository matchRepository;
    private final MatchService matchService;
    private final FfmSyncRunRepository runRepository;
    private final UserRepository userRepository;
    private final ResendEmailService emailService;

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

    public FfmSyncService(CompetitionRepository competitionRepository,
                          MatchRepository matchRepository,
                          MatchService matchService,
                          FfmSyncRunRepository runRepository,
                          UserRepository userRepository,
                          ResendEmailService emailService) {
        this.competitionRepository = competitionRepository;
        this.matchRepository = matchRepository;
        this.matchService = matchService;
        this.runRepository = runRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    /** Partido parseado de la web de la federacion. */
    public record FfmMatch(int jornada, LocalDateTime date, String venue,
                           String homeCode, String homeName,
                           String awayCode, String awayName,
                           Integer homeGoals, Integer awayGoals, boolean wePlay, Boolean weAreHome) {
    }

    // ---------- API publica ----------

    @Transactional(readOnly = true)
    public FfmSyncResultDTO preview(Long competitionId) {
        Competition competition = getCompetition(competitionId);
        FfmConfig config = configOf(competition);
        List<FfmMatch> ours = fetchOurMatches(config);
        List<Match> existing = matchRepository.findByCompetitionId(competition.getId());
        List<FfmSyncActionDTO> actions = computeActions(competition, ours, existing);
        return resultOf(competition, ours, actions, null);
    }

    @Transactional
    public FfmSyncResultDTO apply(Long competitionId) {
        return apply(competitionId, FfmSyncRun.Trigger.MANUAL);
    }

    @Transactional
    public FfmSyncResultDTO apply(Long competitionId, FfmSyncRun.Trigger trigger) {
        Competition competition = getCompetition(competitionId);
        FfmSyncRun run = new FfmSyncRun();
        run.setCompetitionId(competition.getId());
        run.setCompetitionName(competition.getName());
        run.setTriggeredBy(trigger);
        run.setStartedAt(LocalDateTime.now());
        run = runRepository.save(run);
        try {
            FfmConfig config = configOf(competition);
            List<FfmMatch> ours = fetchOurMatches(config);
            List<Match> existing = matchRepository.findByCompetitionId(competition.getId());
            List<FfmSyncActionDTO> actions = computeActions(competition, ours, existing);
            int created = 0;
            int updated = 0;
            List<MatchDTO> createdMatches = new ArrayList<>();
            List<String> updatedDetails = new ArrayList<>();
            for (int i = 0; i < ours.size(); i++) {
                FfmMatch parsed = ours.get(i);
                FfmSyncActionDTO action = actions.get(i);
                if ("SKIP".equals(action.getAction())) {
                    continue;
                }
                Match target = findExisting(existing, competition.getId(), parsed);
                if (target == null) {
                    createdMatches.add(matchService.createMatch(toRequest(competition, parsed, null)));
                    created++;
                } else if ("UPDATED".equals(action.getAction())) {
                    MatchDTO dto = matchService.updateMatch(target.getId(), toRequest(competition, parsed, target));
                    updatedDetails.add("Jornada " + dto.getJornada() + ": Real Lisiados vs " + dto.getRival()
                            + (action.getDetail() == null || action.getDetail().isBlank() ? "" : " (" + action.getDetail() + ")"));
                    updated++;
                }
            }
            long unchanged = actions.stream().filter(a -> "UNCHANGED".equals(a.getAction())).count();
            run.setRoundsChecked((int) ours.stream().map(FfmMatch::jornada).distinct().count());
            run.setCreated(created);
            run.setUpdated(updated);
            run.setUnchanged((int) unchanged);
            run.setStatus(FfmSyncRun.Status.OK);
            run.setFinishedAt(LocalDateTime.now());
            run = runRepository.save(run);
            notifyScheduleNews(competition, createdMatches, updatedDetails);
            FfmSyncResultDTO result = resultOf(competition, ours, actions, run.getId());
            result.setCreated(created);
            result.setUpdated(updated);
            result.setUnchanged((int) unchanged);
            return result;
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            run.setStatus(FfmSyncRun.Status.FAILED);
            run.setFinishedAt(LocalDateTime.now());
            run.setError(truncate(e.toString(), 2000));
            runRepository.save(run);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Fallo al sincronizar con la federacion: " + e.getMessage());
        }
    }

    /** Asunto + cuerpo HTML del aviso de horarios / próximo partido. */
    public record ScheduleMail(String subject, String html) {
    }

    /**
     * Envía a una única dirección el aviso del próximo partido de una competición.
     * Pensado para probar la configuración de correo desde el panel admin sin
     * lanzar una sincronización real ni spamear a todos los usuarios.
     */
    @Transactional(readOnly = true)
    public void sendNextMatchPreview(Long competitionId, String recipient) {
        if (!emailService.isEnabled()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "El envío de correos está desactivado (EMAIL_ENABLED=false)");
        }
        Competition competition = getCompetition(competitionId);
        Match next = findNextScheduledMatch(competitionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No hay próximo partido programado para esta competición"));
        ScheduleMail mail = buildScheduleMail(competition, next, List.of(), List.of());
        emailService.send(recipient, "[PRUEBA] " + mail.subject(),
                "<p><em>Correo de prueba enviado desde el panel admin. Solo lo has recibido tú.</em></p>"
                        + mail.html());
    }

    private java.util.Optional<Match> findNextScheduledMatch(Long competitionId) {
        return matchRepository.findFirstByCompetitionIdAndStatusAndDateGreaterThanEqualOrderByDateAsc(
                competitionId, MatchStatus.SCHEDULED, LocalDateTime.now());
    }

    /**
     * Avisa por email a todos los usuarios verificados cuando el scraping trae
     * novedades (partidos nuevos o cambios de horario/sede). El correo destaca
     * el próximo partido por jugar. Si no hay novedades, no se envía nada
     * para no spamear en las sincronizaciones programadas sin cambios.
     */
    private void notifyScheduleNews(Competition competition, List<MatchDTO> createdMatches, List<String> updatedDetails) {
        if (createdMatches.isEmpty() && updatedDetails.isEmpty()) return;
        Match next = findNextScheduledMatch(competition.getId()).orElse(null);
        ScheduleMail mail = buildScheduleMail(competition, next, createdMatches, updatedDetails);
        for (es.adri.demo.model.User user : userRepository.findByEmailVerifiedTrue()) {
            try {
                emailService.send(user.getEmail(), mail.subject(), mail.html());
            } catch (Exception e) {
                log.warn("No se pudo enviar el aviso de horarios a {}", user.getEmail(), e);
            }
        }
    }

    private ScheduleMail buildScheduleMail(Competition competition, Match next,
                                           List<MatchDTO> createdMatches, List<String> updatedDetails) {
        String subject;
        StringBuilder html = new StringBuilder();
        if (next != null) {
            subject = "Próximo partido: Real Lisiados vs " + next.getRival();
            html.append("<h2>Próximo partido</h2>")
                    .append("<p><strong>Real Lisiados vs ").append(next.getRival()).append("</strong></p>")
                    .append("<p>")
                    .append(next.getDate() == null ? "Fecha por confirmar" : "Fecha: " + next.getDate())
                    .append(next.getLocation() == null ? "" : "<br>Sede: " + next.getLocation())
                    .append(next.getJornada() == null ? "" : "<br>Jornada " + next.getJornada())
                    .append("<br>Competición: ").append(competition.getName())
                    .append("</p>");
        } else {
            subject = "Nuevos horarios de " + competition.getName();
            html.append("<h2>Novedades en ").append(competition.getName()).append("</h2>");
        }
        if (!createdMatches.isEmpty()) {
            html.append("<p>Partidos añadidos:</p><ul>");
            for (MatchDTO match : createdMatches) {
                html.append("<li>Jornada ").append(match.getJornada())
                        .append(": Real Lisiados vs ").append(match.getRival())
                        .append(match.getDate() == null ? "" : " · " + match.getDate())
                        .append(match.getLocation() == null ? "" : " · " + match.getLocation())
                        .append("</li>");
            }
            html.append("</ul>");
        }
        if (!updatedDetails.isEmpty()) {
            html.append("<p>Partidos actualizados (cambios de horario, sede o resultado):</p><ul>");
            for (String detail : updatedDetails) {
                html.append("<li>").append(detail).append("</li>");
            }
            html.append("</ul>");
        }
        html.append("<p>Consulta el calendario completo en la web de RELI.</p>");
        return new ScheduleMail(subject, html.toString());
    }

    /** Sincroniza todas las competiciones configuradas (usado por el programador). */
    @Transactional
    public void syncAllScheduled() {
        for (Competition competition : competitionRepository.findAll()) {
            if (competition.getFfmCompeticion() == null || competition.getFfmCompeticion().isBlank()) {
                continue;
            }
            try {
                apply(competition.getId(), FfmSyncRun.Trigger.SCHEDULED);
            } catch (Exception e) {
                FfmSyncRun run = new FfmSyncRun();
                run.setCompetitionId(competition.getId());
                run.setCompetitionName(competition.getName());
                run.setTriggeredBy(FfmSyncRun.Trigger.SCHEDULED);
                run.setStartedAt(LocalDateTime.now());
                run.setFinishedAt(LocalDateTime.now());
                run.setStatus(FfmSyncRun.Status.FAILED);
                run.setError(truncate(e.toString(), 2000));
                runRepository.save(run);
            }
        }
    }

    @Transactional(readOnly = true)
    public List<FfmSyncRun> lastRuns() {
        return runRepository.findTop20ByOrderByStartedAtDesc();
    }

    // ---------- Nucleo ----------

    private Competition getCompetition(Long id) {
        return competitionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Competicion no encontrada"));
    }

    private record FfmConfig(String competicion, String grupo, String temporada, String ourCode) {
    }

    private FfmConfig configOf(Competition competition) {
        if (competition.getFfmCompeticion() == null || competition.getFfmCompeticion().isBlank()
                || competition.getFfmGrupo() == null || competition.getFfmGrupo().isBlank()
                || competition.getFfmTemporada() == null || competition.getFfmTemporada().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La competicion no tiene configuracion FFM (competicion, grupo y temporada)");
        }
        String ourCode = competition.getFfmOurCode() == null || competition.getFfmOurCode().isBlank()
                ? "320143" : competition.getFfmOurCode().trim();
        return new FfmConfig(competition.getFfmCompeticion().trim(),
                competition.getFfmGrupo().trim(), competition.getFfmTemporada().trim(), ourCode);
    }

    private void checkCredentials() {
        if (ffmUser == null || ffmUser.isBlank() || ffmPassword == null || ffmPassword.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Faltan las credenciales FFM en el servidor (FFM_USER / FFM_PASS)");
        }
    }

    private List<FfmMatch> fetchOurMatches(FfmConfig config) {
        checkCredentials();
        try {
            HttpClient client = HttpClient.newBuilder()
                    .cookieHandler(new CookieManager(null, CookiePolicy.ACCEPT_ALL))
                    .followRedirects(HttpClient.Redirect.NEVER)
                    .connectTimeout(Duration.ofSeconds(30))
                    .build();
            String loginBody = "NUser=" + urlEncode(ffmUser)
                    + "&NPass=" + urlEncode(ffmPassword)
                    + "&LoginAjax=1";
            HttpResponse<String> login = client.send(
                    HttpRequest.newBuilder(URI.create(baseUrl + "/nfg/NLogin"))
                            .header("Content-Type", "application/x-www-form-urlencoded")
                            .POST(HttpRequest.BodyPublishers.ofString(loginBody))
                            .timeout(Duration.ofSeconds(30))
                            .build(),
                    HttpResponse.BodyHandlers.ofString());
            String location = login.headers().firstValue("Location").orElse("");
            if (login.statusCode() != 302 || !location.contains("NLogin")) {
                throw new IllegalStateException("Login inesperado: HTTP " + login.statusCode());
            }
            HttpResponse<String> session = client.send(
                    HttpRequest.newBuilder(URI.create(baseUrl + location))
                            .GET().timeout(Duration.ofSeconds(30)).build(),
                    HttpResponse.BodyHandlers.ofString());
            if (!session.body().contains("estado=\"1\"") && !session.body().contains("estado='1'")) {
                throw new IllegalStateException("Login rechazado por la federacion");
            }
            // Descubrir jornadas desde la primera pagina
            String first = fetchJornada(client, config, 1);
            List<Integer> rounds = roundRange(first);
            List<FfmMatch> all = new ArrayList<>(parseJornada(first, 1, config.ourCode()));
            for (int round : rounds) {
                if (round == 1) {
                    continue;
                }
                all.addAll(parseJornada(fetchJornada(client, config, round), round, config.ourCode()));
            }
            List<FfmMatch> ours = new ArrayList<>();
            for (FfmMatch match : all) {
                if (match.wePlay()) {
                    ours.add(match);
                }
            }
            ours.sort(Comparator.comparingInt(FfmMatch::jornada));
            return ours;
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("No se pudo leer la federacion: " + e.getMessage(), e);
        }
    }

    private String fetchJornada(HttpClient client, FfmConfig config, int round) throws Exception {
        String url = baseUrl + "/nfg/NPcd/NFG_CmpJornada"
                + "?cod_primaria=" + urlEncode(codPrimaria)
                + "&CodCompeticion=" + urlEncode(config.competicion())
                + "&CodGrupo=" + urlEncode(config.grupo())
                + "&CodTemporada=" + urlEncode(config.temporada())
                + "&CodJornada=" + round
                + "&cod_agrupacion=" + urlEncode(codAgrupacion)
                + "&Sch_Tipo_Juego=" + urlEncode(tipoJuego);
        HttpResponse<byte[]> response = client.send(
                HttpRequest.newBuilder(URI.create(url)).GET().timeout(Duration.ofSeconds(30)).build(),
                HttpResponse.BodyHandlers.ofByteArray());
        if (response.statusCode() != 200) {
            throw new IllegalStateException("La federacion devolvio HTTP " + response.statusCode());
        }
        String html = decode(response.body());
        if (html.length() > 2000 && html.substring(0, 2000).contains("<title>Novanet | Login")) {
            throw new IllegalStateException("Sesion caducada en la federacion");
        }
        return html;
    }

    public static String decode(byte[] bytes) {
        CharsetDecoder decoder = StandardCharsets.UTF_8.newDecoder()
                .onMalformedInput(CodingErrorAction.REPORT)
                .onUnmappableCharacter(CodingErrorAction.REPORT);
        try {
            return decoder.decode(ByteBuffer.wrap(bytes)).toString();
        } catch (CharacterCodingException e) {
            return new String(bytes, java.nio.charset.Charset.forName("windows-1252"));
        }
    }

    public static List<Integer> roundRange(String html) {
        Matcher matcher = RE_ROUND_OPT.matcher(html);
        Set<Integer> rounds = new java.util.TreeSet<>();
        while (matcher.find()) {
            rounds.add(Integer.parseInt(matcher.group(1)));
        }
        return new ArrayList<>(rounds);
    }

    public static List<FfmMatch> parseJornada(String html, int jornada, String ourCode) {
        Map<String, String> names = new LinkedHashMap<>();
        Matcher teams = RE_TEAMS.matcher(html);
        while (teams.find()) {
            names.putIfAbsent(teams.group(1), teams.group(2).trim().replaceAll("\\s+", " "));
        }
        List<Object[]> dates = findAll(RE_DATES, html);
        List<Object[]> times = findAll(RE_TIMES, html);
        List<Object[]> campos = findAll(RE_CAMPO, html);
        String fallback = null;
        Matcher roundOpt = RE_ROUND_OPT.matcher(html);
        while (roundOpt.find()) {
            if (Integer.parseInt(roundOpt.group(1)) == jornada) {
                fallback = roundOpt.group(2);
            }
        }

        List<Object[]> comps = new ArrayList<>();
        Set<String> seenPairs = new LinkedHashSet<>();
        Matcher comp = RE_COMP.matcher(html);
        while (comp.find()) {
            String key = comp.group(1) + "-" + comp.group(2);
            if (seenPairs.add(key)) {
                comps.add(new Object[]{comp.group(1), comp.group(2), comp.start()});
            }
        }

        List<FfmMatch> out = new ArrayList<>();
        for (int i = 0; i < comps.size(); i++) {
            String e1 = (String) comps.get(i)[0];
            String e2 = (String) comps.get(i)[1];
            int pos = (int) comps.get(i)[2];
            int lo = i > 0 ? (int) comps.get(i - 1)[2] : 0;
            int hi = i < comps.size() - 1 ? (int) comps.get(i + 1)[2] : html.length();
            String fecha = nearest(dates, pos, lo, hi);
            String hora = nearest(times, pos, lo, hi);
            String venue = nearest(campos, pos, lo, hi);
            if (fecha == null) {
                fecha = fallback;
            }
            if (hora == null) {
                hora = "00:00";
            }
            Integer homeGoals = null;
            Integer awayGoals = null;
            String seg = html.substring(lo, hi);
            seg = RE_SELECT.matcher(seg).replaceAll(" ");
            seg = RE_TAG.matcher(seg).replaceAll(" ");
            seg = RE_DATE.matcher(seg).replaceAll(" ");
            seg = RE_TIME.matcher(seg).replaceAll(" ");
            Matcher score = RE_SCORE.matcher(seg);
            if (score.find()) {
                homeGoals = Integer.parseInt(score.group(1));
                awayGoals = Integer.parseInt(score.group(2));
            }
            LocalDateTime date = null;
            if (fecha != null) {
                try {
                    date = LocalDateTime.parse(fecha + " " + hora, DATE_TIME_FORMAT);
                } catch (Exception ignored) {
                    date = null;
                }
            }
            boolean wePlay = ourCode.equals(e1) || ourCode.equals(e2);
            Boolean weAreHome = wePlay ? ourCode.equals(e1) : null;
            out.add(new FfmMatch(jornada, date, venue == null || venue.isBlank() ? null : venue.trim(),
                    e1, names.getOrDefault(e1, e1), e2, names.getOrDefault(e2, e2),
                    homeGoals, awayGoals, wePlay, weAreHome));
        }
        return out;
    }

    private static List<Object[]> findAll(Pattern pattern, String html) {
        List<Object[]> out = new ArrayList<>();
        Matcher matcher = pattern.matcher(html);
        while (matcher.find()) {
            out.add(new Object[]{matcher.group(1).trim().replaceAll("\\s+", " "), matcher.start()});
        }
        return out;
    }

    private static String nearest(List<Object[]> items, int pos, int lo, int hi) {
        String best = null;
        int bestDist = Integer.MAX_VALUE;
        for (Object[] item : items) {
            int itemPos = (int) item[1];
            if (itemPos > lo && itemPos < hi) {
                int dist = Math.abs(itemPos - pos);
                if (dist < bestDist) {
                    bestDist = dist;
                    best = (String) item[0];
                }
            }
        }
        return best;
    }

    // ---------- Comparacion con la BD ----------

    public static String norm(String name) {
        if (name == null) {
            return "";
        }
        String decomposed = Normalizer.normalize(name, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        return decomposed.toUpperCase().replaceAll("[^A-Z0-9 ]", " ").replaceAll("\\s+", " ").trim();
    }

    public static String smartTitle(String name) {
        if (name == null || name.isEmpty() || !name.equals(name.toUpperCase())) {
            return name;
        }
        List<String> out = new ArrayList<>();
        String[] words = name.split("\\s+");
        for (int i = 0; i < words.length; i++) {
            String word = words[i];
            String core = word.replaceAll("^\\.+|\\.+$", "");
            if (UPPER_TOKENS.contains(core)) {
                out.add(word);
            } else if (i > 0 && LOWER_TOKENS.contains(word.toLowerCase())) {
                out.add(word.toLowerCase());
            } else if (word.isEmpty()) {
                out.add(word);
            } else {
                out.add(word.substring(0, 1).toUpperCase() + word.substring(1).toLowerCase());
            }
        }
        return String.join(" ", out);
    }

    private static boolean hasTime(LocalDateTime date) {
        return date != null && (date.getHour() != 0 || date.getMinute() != 0);
    }

    private static boolean sameDay(LocalDateTime a, LocalDateTime b) {
        return a != null && b != null && a.toLocalDate().equals(b.toLocalDate());
    }

    private Match findExisting(List<Match> existing, Long competitionId, FfmMatch parsed) {
        String rival = parsed.weAreHome() ? parsed.awayName() : parsed.homeName();
        String wanted = norm(rival);
        for (Match match : existing) {
            if (match.getJornada() != null && match.getJornada() == parsed.jornada()
                    && norm(match.getRival()).equals(wanted)) {
                return match;
            }
        }
        String wantDay = parsed.date() == null ? "" : parsed.date().toLocalDate().toString();
        for (Match match : existing) {
            if ((match.getJornada() == null || match.getJornada() == 0)
                    && norm(match.getRival()).equals(wanted)
                    && match.getDate() != null
                    && match.getDate().toLocalDate().toString().equals(wantDay)) {
                return match;
            }
        }
        return null;
    }

    private MatchRequestDTO toRequest(Competition competition, FfmMatch parsed, Match existing) {
        boolean home = Boolean.TRUE.equals(parsed.weAreHome());
        String rival = parsed.weAreHome() ? parsed.awayName() : parsed.homeName();
        Integer ourGoals = parsed.weAreHome() ? parsed.homeGoals() : parsed.awayGoals();
        Integer rivalGoals = parsed.weAreHome() ? parsed.awayGoals() : parsed.homeGoals();
        boolean finished = ourGoals != null && rivalGoals != null;

        LocalDateTime baseDate = existing == null ? null : existing.getDate();
        LocalDateTime newDate;
        if (hasTime(parsed.date())) {
            newDate = parsed.date();
        } else if (baseDate != null && sameDay(parsed.date(), baseDate)) {
            newDate = baseDate;
        } else if (existing == null) {
            newDate = parsed.date();
        } else if (parsed.date() != null && !sameDay(parsed.date(), baseDate)) {
            newDate = parsed.date();
        } else {
            newDate = baseDate;
        }
        String venue = parsed.venue() == null || parsed.venue().isBlank()
                ? (existing == null ? null : existing.getLocation())
                : parsed.venue();

        MatchRequestDTO dto = new MatchRequestDTO();
        dto.setRival(smartTitle(rival));
        dto.setHome(home);
        dto.setDate(newDate);
        dto.setLocation(venue);
        if (finished) {
            dto.setStatus(MatchStatus.FINISHED);
            dto.setOurGoals(ourGoals);
            dto.setRivalGoals(rivalGoals);
        } else if (existing == null) {
            dto.setStatus(MatchStatus.SCHEDULED);
            dto.setOurGoals(0);
            dto.setRivalGoals(0);
        } else {
            dto.setStatus(existing.getStatus());
            dto.setOurGoals(existing.getOurGoals());
            dto.setRivalGoals(existing.getRivalGoals());
        }
        dto.setJornada(parsed.jornada());
        dto.setCompetitionId(competition.getId());
        return dto;
    }

    private List<FfmSyncActionDTO> computeActions(Competition competition, List<FfmMatch> ours, List<Match> existing) {
        List<FfmSyncActionDTO> actions = new ArrayList<>();
        for (FfmMatch parsed : ours) {
            String rival = parsed.weAreHome() ? parsed.awayName() : parsed.homeName();
            Match target = findExisting(existing, competition.getId(), parsed);
            MatchRequestDTO wanted = toRequest(competition, parsed, target);
            FfmSyncActionDTO action = new FfmSyncActionDTO();
            action.setJornada(parsed.jornada());
            action.setRival(smartTitle(rival));
            action.setHome(parsed.weAreHome());
            action.setDate(wanted.getDate() == null ? null : wanted.getDate().toString());
            action.setVenue(wanted.getLocation());
            action.setStatus(wanted.getStatus() == null ? null : wanted.getStatus().name());
            if (parsed.date() == null) {
                action.setAction("SKIP");
                action.setDetail("Sin fecha en la federacion");
            } else if (target == null) {
                action.setAction("CREATED");
                action.setDetail("Nuevo partido");
            } else if (changed(target, wanted)) {
                action.setAction("UPDATED");
                action.setDetail(describeChanges(target, wanted));
            } else {
                action.setAction("UNCHANGED");
                action.setDetail("");
            }
            actions.add(action);
        }
        return actions;
    }

    private boolean changed(Match current, MatchRequestDTO wanted) {
        return !equalsNullable(current.getRival(), wanted.getRival())
                || current.isHome() != wanted.isHome()
                || !equalsNullable(current.getDate(), wanted.getDate())
                || !equalsNullable(current.getLocation(), wanted.getLocation())
                || current.getStatus() != wanted.getStatus()
                || !equalsNullable(current.getOurGoals(), wanted.getOurGoals())
                || !equalsNullable(current.getRivalGoals(), wanted.getRivalGoals())
                || !equalsNullable(current.getJornada(), wanted.getJornada());
    }

    private boolean equalsNullable(Object a, Object b) {
        return a == null ? b == null : a.equals(b);
    }

    private String describeChanges(Match current, MatchRequestDTO wanted) {
        List<String> parts = new ArrayList<>();
        if (!equalsNullable(current.getRival(), wanted.getRival())) {
            parts.add("rival");
        }
        if (current.isHome() != wanted.isHome()) {
            parts.add("local/visitante");
        }
        if (!equalsNullable(current.getDate(), wanted.getDate())) {
            parts.add("fecha/hora");
        }
        if (!equalsNullable(current.getLocation(), wanted.getLocation())) {
            parts.add("sede");
        }
        if (current.getStatus() != wanted.getStatus()) {
            parts.add("estado");
        }
        if (!equalsNullable(current.getOurGoals(), wanted.getOurGoals())
                || !equalsNullable(current.getRivalGoals(), wanted.getRivalGoals())) {
            parts.add("goles");
        }
        if (!equalsNullable(current.getJornada(), wanted.getJornada())) {
            parts.add("jornada");
        }
        return parts.isEmpty() ? "" : "Cambia: " + String.join(", ", parts);
    }

    private FfmSyncResultDTO resultOf(Competition competition, List<FfmMatch> ours,
                                      List<FfmSyncActionDTO> actions, Long runId) {
        FfmSyncResultDTO result = new FfmSyncResultDTO();
        result.setCompetitionId(competition.getId());
        result.setCompetitionName(competition.getName());
        result.setRoundsChecked((int) ours.stream().map(FfmMatch::jornada).distinct().count());
        result.setCreated((int) actions.stream().filter(a -> "CREATED".equals(a.getAction())).count());
        result.setUpdated((int) actions.stream().filter(a -> "UPDATED".equals(a.getAction())).count());
        result.setUnchanged((int) actions.stream().filter(a -> "UNCHANGED".equals(a.getAction())).count());
        result.setRestWeeks(new ArrayList<>());
        result.setActions(actions);
        result.setRunId(runId);
        return result;
    }

    private String urlEncode(String value) {
        return URLEncoder.encode(value == null ? "" : value, StandardCharsets.UTF_8);
    }

    private String truncate(String value, int max) {
        if (value == null || value.length() <= max) {
            return value;
        }
        return value.substring(0, max);
    }
}
