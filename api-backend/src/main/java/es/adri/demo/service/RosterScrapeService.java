package es.adri.demo.service;

import es.adri.demo.dto.ScrapedPlayerDTO;
import es.adri.demo.model.Competition;
import es.adri.demo.model.Player;
import es.adri.demo.model.PlayerSeason;
import es.adri.demo.model.Position;
import es.adri.demo.model.Season;
import es.adri.demo.repository.CompetitionRepository;
import es.adri.demo.repository.PlayerRepository;
import es.adri.demo.repository.PlayerSeasonRepository;
import es.adri.demo.repository.SeasonRepository;
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
import java.time.Duration;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RosterScrapeService {

    private static final Pattern RE_CODACTA = Pattern.compile("NFG_CmpPartido\\?cod_primaria=\\d+&CodActa=(\\d+)&cod_acta=\\d+", Pattern.CASE_INSENSITIVE);
    private static final Pattern RE_EQUIPOS = Pattern.compile("<span class=\"tituloprograma\">\\s*(.*?)\\s*</span>", Pattern.DOTALL);
    private static final Pattern RE_PLAYER_ROW = Pattern.compile("<td[^>]*>&nbsp;&nbsp;(\\d+)&nbsp;.*?</td>\\s*<td[^>]*><p[^>]*>&nbsp;(.*?)</p>", Pattern.DOTALL);
    private static final Pattern RE_JORNADA = Pattern.compile("Jornada\\s+(\\d+)");

    private final CompetitionRepository competitionRepository;
    private final PlayerRepository playerRepository;
    private final PlayerSeasonRepository playerSeasonRepository;
    private final SeasonRepository seasonRepository;
    private final es.adri.demo.repository.MatchRepository matchRepository;

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
    @Value("${app.bootstrap-admin.username:admin}")
    private String adminUsername;
    @Value("${app.bootstrap-admin.password:Admin1234}")
    private String adminPassword;
    @Value("${server.port:8080}")
    private String serverPort;

    public RosterScrapeService(CompetitionRepository competitionRepository, PlayerRepository playerRepository, PlayerSeasonRepository playerSeasonRepository, SeasonRepository seasonRepository, es.adri.demo.repository.MatchRepository matchRepository) {
        this.competitionRepository = competitionRepository;
        this.playerRepository = playerRepository;
        this.playerSeasonRepository = playerSeasonRepository;
        this.seasonRepository = seasonRepository;
        this.matchRepository = matchRepository;
    }

    public List<ScrapedPlayerDTO> scrapeSeason(Long seasonId) {
        List<Competition> comps = competitionRepository.findBySeasonId(seasonId);
        List<Competition> ffmComps = comps.stream().filter(c -> c.getFfmCompeticion() != null && !c.getFfmCompeticion().isBlank()).toList();
        if (ffmComps.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ninguna competición de esa temporada tiene configuración FFM");
        checkCredentials();
        Map<String, ScrapedPlayerDTO> byName = new LinkedHashMap<>();
        try {
            HttpClient client = HttpClient.newBuilder()
                    .cookieHandler(new CookieManager(null, CookiePolicy.ACCEPT_ALL))
                    .followRedirects(HttpClient.Redirect.NEVER)
                    .connectTimeout(Duration.ofSeconds(30))
                    .build();
            login(client);
            for (Competition comp : ffmComps) {
                String competicion = comp.getFfmCompeticion().trim();
                String grupo = comp.getFfmGrupo() == null ? "" : comp.getFfmGrupo().trim();
                String temporada = comp.getFfmTemporada() == null ? "" : comp.getFfmTemporada().trim();
                // descubrir jornadas: fetch 1 y parsear round options
                String firstHtml = fetchJornada(client, competicion, grupo, temporada, 1);
                List<Integer> rounds = roundRange(firstHtml);
                if (rounds.isEmpty()) rounds = List.of(1);
                for (int round : rounds) {
                    String html = round == 1 ? firstHtml : fetchJornada(client, competicion, grupo, temporada, round);
                    List<String> codactas = extractCodactas(html);
                    for (String codacta : codactas) {
                        try {
                            String actaHtml = fetchActa(client, codacta);
                            Map<String, Integer> players = parseActaRoster(actaHtml);
                            for (Map.Entry<String, Integer> e : players.entrySet()) {
                                String fullName = e.getKey();
                                String norm = normalize(fullName);
                                ScrapedPlayerDTO dto = byName.get(norm);
                                if (dto == null) {
                                    String[] split = splitName(fullName);
                                    dto = new ScrapedPlayerDTO(fullName, split[0], split[1], e.getValue(), 1);
                                    byName.put(norm, dto);
                                } else {
                                    dto.setAppearances(dto.getAppearances() + 1);
                                    // keep first dorsal
                                }
                            }
                        } catch (Exception ex) {
                            // ignorar actas individuales que fallen
                        }
                    }
                }
            }
        } catch (ResponseStatusException e) { throw e; }
        catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Fallo al scrapear FFM: " + e.getMessage());
        }
        List<ScrapedPlayerDTO> out = new ArrayList<>(byName.values());
        out.sort(Comparator.comparing(ScrapedPlayerDTO::getFullName));
        return out;
    }

    @Transactional(readOnly = true)
    public es.adri.demo.dto.StatsScrapeResultDTO scrapeSingleMatchActa(Long matchId) {
        es.adri.demo.model.Match match = matchRepository.findWithCompetitionById(matchId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Partido no encontrado"));
        Competition comp = match.getCompetition();
        if (comp == null || comp.getFfmCompeticion() == null || comp.getFfmTemporada() == null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El partido no tiene competición con configuración FFM");
        Integer jornada = match.getJornada();
        if (jornada == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El partido no tiene jornada");
        checkCredentials();
        try {
            HttpClient client = HttpClient.newBuilder().cookieHandler(new CookieManager(null, CookiePolicy.ACCEPT_ALL)).followRedirects(HttpClient.Redirect.NEVER).connectTimeout(Duration.ofSeconds(30)).build();
            login(client);
            String html = fetchJornada(client, comp.getFfmCompeticion().trim(), comp.getFfmGrupo() == null ? "" : comp.getFfmGrupo().trim(), comp.getFfmTemporada().trim(), jornada);
            List<String> codactas = extractCodactas(html);
            String target = null;
            String ourTeamCandidate = null;
            // La jornada trae varias actas. El rival puede tener variantes de escritura en FFM,
            // pero Real Lisiados identifica de forma única nuestro partido de la jornada.
            for (String cod : codactas) {
                try {
                    String actaHtml = fetchActa(client, cod);
                    if (!hasOurTeam(actaHtml)) continue;
                    if (ourTeamCandidate == null) ourTeamCandidate = cod;
                    if (isExpectedActa(actaHtml, match.getRival())) {
                        target = cod;
                        break;
                    }
                } catch (Exception ignored) {}
            }
            if (target == null) target = ourTeamCandidate;
            if (target == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No se encontró el acta de Real Lisiados vs " + match.getRival() + " para J" + jornada);
            }

            String script = "scripts/ffmadrid_acta_import.py";
            if (!java.nio.file.Files.exists(java.nio.file.Paths.get(script))) script = "../scripts/ffmadrid_acta_import.py";
            if (!java.nio.file.Files.exists(java.nio.file.Paths.get(script))) script = "E:/Proyectos/RELI-WebApp/scripts/ffmadrid_acta_import.py";
            ProcessBuilder pb = new ProcessBuilder("python", script, "--codacta", target, "--match-id", String.valueOf(matchId), "--api", "http://localhost:" + serverPort + "/api", "--admin-user", adminUsername, "--admin-pass", adminPassword, "--apply", "--ffm-competicion", comp.getFfmCompeticion().trim(), "--ffm-grupo", comp.getFfmGrupo() == null ? "" : comp.getFfmGrupo().trim(), "--ffm-temporada", comp.getFfmTemporada().trim());
            Map<String,String> env = pb.environment();
            env.put("FFM_USER", ffmUser); env.put("FFM_PASS", ffmPassword); env.put("ADMIN_USERNAME", adminUsername); env.put("ADMIN_PASSWORD", adminPassword);
            pb.redirectErrorStream(true);
            Process proc = pb.start();
            String out = new String(proc.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            int exit = proc.waitFor();
            if (exit != 0) throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Importador falló: " + out);
            Matcher m = Pattern.compile("callups.:\\s*(\\d+).*goals.:\\s*(\\d+).*stats.:\\s*(\\d+).*stats_updated.:\\s*(\\d+)", Pattern.CASE_INSENSITIVE).matcher(out);
            int callups=0, goals=0, stats=0, statsUpd=0;
            if (m.find()) { callups=Integer.parseInt(m.group(1)); goals=Integer.parseInt(m.group(2)); stats=Integer.parseInt(m.group(3)); statsUpd=Integer.parseInt(m.group(4)); }
            return new es.adri.demo.dto.StatsScrapeResultDTO(1, callups, goals, stats, statsUpd, 0, "Acta " + target + " importada");
        } catch (ResponseStatusException e) { throw e; }
        catch (Exception e) { throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Fallo al scrapear acta: " + e.getMessage()); }
    }

    public es.adri.demo.dto.StatsScrapeResultDTO scrapeStats(Long seasonId) {
        List<Competition> comps = competitionRepository.findBySeasonId(seasonId);
        List<Competition> ffmComps = comps.stream().filter(c -> c.getFfmCompeticion() != null && !c.getFfmCompeticion().isBlank()).toList();
        if (ffmComps.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ninguna competición de esa temporada tiene configuración FFM");
        checkCredentials();
        int actas = 0; int callups = 0; int goals = 0; int stats = 0; int statsUpd = 0; int playersCreated = 0;
        try {
            HttpClient client = HttpClient.newBuilder().cookieHandler(new CookieManager(null, CookiePolicy.ACCEPT_ALL)).followRedirects(HttpClient.Redirect.NEVER).connectTimeout(Duration.ofSeconds(30)).build();
            login(client);
            for (Competition comp : ffmComps) {
                String competicion = comp.getFfmCompeticion().trim();
                String grupo = comp.getFfmGrupo() == null ? "" : comp.getFfmGrupo().trim();
                String temporada = comp.getFfmTemporada() == null ? "" : comp.getFfmTemporada().trim();
                String firstHtml = fetchJornada(client, competicion, grupo, temporada, 1);
                List<Integer> rounds = roundRange(firstHtml);
                if (rounds.isEmpty()) rounds = List.of(1);
                for (int round : rounds) {
                    String html = round == 1 ? firstHtml : fetchJornada(client, competicion, grupo, temporada, round);
                    List<String> codactas = extractCodactas(html);
                    for (String codacta : codactas) {
                        try {
                            String script = "scripts/ffmadrid_acta_import.py";
                            if (!java.nio.file.Files.exists(java.nio.file.Paths.get(script))) script = "../scripts/ffmadrid_acta_import.py";
                            if (!java.nio.file.Files.exists(java.nio.file.Paths.get(script))) script = "E:/Proyectos/RELI-WebApp/scripts/ffmadrid_acta_import.py";
                            ProcessBuilder pb = new ProcessBuilder(
                                    "python", script,
                                    "--codacta", codacta,
                                    "--competition-id", String.valueOf(comp.getId()),
                                    "--api", "http://localhost:" + serverPort + "/api",
                                    "--admin-user", adminUsername,
                                    "--admin-pass", adminPassword,
                                    "--apply",
                                    "--ffm-competicion", competicion,
                                    "--ffm-grupo", grupo,
                                    "--ffm-temporada", temporada
                            );
                            Map<String,String> env = pb.environment();
                            env.put("FFM_USER", ffmUser);
                            env.put("FFM_PASS", ffmPassword);
                            env.put("ADMIN_USERNAME", adminUsername);
                            env.put("ADMIN_PASSWORD", adminPassword);
                            pb.redirectErrorStream(true);
                            Process proc = pb.start();
                            String out = new String(proc.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
                            int exit = proc.waitFor();
                            if (exit == 0) {
                                actas++;
                                // parsear contadores del output "Aplicado: {callups: X, goals: Y, ...}"
                                Matcher m = Pattern.compile("callups.:\\s*(\\d+).*goals.:\\s*(\\d+).*stats.:\\s*(\\d+).*stats_updated.:\\s*(\\d+)", Pattern.CASE_INSENSITIVE).matcher(out);
                                if (m.find()) {
                                    callups += Integer.parseInt(m.group(1));
                                    goals += Integer.parseInt(m.group(2));
                                    stats += Integer.parseInt(m.group(3));
                                    statsUpd += Integer.parseInt(m.group(4));
                                }
                            }
                        } catch (Exception ex) {
                            // ignorar acta fallida
                        }
                    }
                }
            }
        } catch (ResponseStatusException e) { throw e; }
        catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Fallo al scrapear stats: " + e.getMessage());
        }
        return new es.adri.demo.dto.StatsScrapeResultDTO(actas, callups, goals, stats, statsUpd, playersCreated, "Scrapping completado");
    }

    @org.springframework.transaction.annotation.Transactional
    public List<ScrapedPlayerDTO> importScraped(Long seasonId, List<ScrapedPlayerDTO> players) {
        Season season = seasonRepository.findById(seasonId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Temporada no encontrada"));
        List<ScrapedPlayerDTO> imported = new ArrayList<>();
        for (ScrapedPlayerDTO dto : players) {
            String fullName = dto.getFullName() != null ? dto.getFullName().trim() : "";
            if (fullName.isEmpty()) continue;
            String norm = normalize(fullName);
            Player existing = findPlayerByNormalized(norm);
            Player player = existing;
            if (player == null) {
                String[] split = splitName(fullName);
                player = new Player();
                player.setName(split[0]);
                player.setSurnames(split[1]);
                player.setNickname(split[0]);
                player.setPosition(Position.ALA);
                player.setJerseyNumber(dto.getJerseyNumber() != null ? dto.getJerseyNumber() : 99);
                player.setPhotoUrl("https://pjefzhrnoftaovlvnjaz.supabase.co/storage/v1/object/public/images/default-player.png");
                player.setActive(true);
                player = playerRepository.save(player);
            }
            var existingPs = playerSeasonRepository.findByPlayerIdAndSeasonId(player.getId(), seasonId);
            if (existingPs.isEmpty()) {
                PlayerSeason ps = new PlayerSeason();
                ps.setPlayer(player);
                ps.setSeason(season);
                ps.setJerseyNumber(dto.getJerseyNumber() != null ? dto.getJerseyNumber() : player.getJerseyNumber());
                playerSeasonRepository.save(ps);
            } else {
                PlayerSeason ps = existingPs.get();
                if (dto.getJerseyNumber() != null) {
                    ps.setJerseyNumber(dto.getJerseyNumber());
                    playerSeasonRepository.save(ps);
                }
            }
            imported.add(dto);
        }
        return imported;
    }

    private Player findPlayerByNormalized(String norm) {
        for (Player p : playerRepository.findAll()) {
            String cand = normalize((p.getName() + " " + (p.getSurnames() != null ? p.getSurnames() : "")).trim());
            String cand2 = normalize((p.getNickname() != null ? p.getNickname() : p.getName()) + " " + (p.getSurnames() != null ? p.getSurnames() : ""));
            if (cand.equals(norm) || cand2.equals(norm)) return p;
            String full = normalize(p.getName() + " " + (p.getSurnames() != null ? p.getSurnames() : ""));
            if (full.equals(norm)) return p;
        }
        return null;
    }

    private void checkCredentials() {
        if (ffmUser == null || ffmUser.isBlank() || ffmPassword == null || ffmPassword.isBlank())
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Faltan credenciales FFM (FFM_USER / FFM_PASS)");
    }

    private void login(HttpClient client) throws Exception {
        String body = "NUser=" + urlEncode(ffmUser) + "&NPass=" + urlEncode(ffmPassword) + "&LoginAjax=1";
        HttpResponse<String> login = client.send(HttpRequest.newBuilder(URI.create(baseUrl + "/nfg/NLogin"))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(body)).timeout(Duration.ofSeconds(30)).build(), HttpResponse.BodyHandlers.ofString());
        String loc = login.headers().firstValue("Location").orElse("");
        if (login.statusCode() != 302 || !loc.contains("NLogin"))
            throw new IllegalStateException("Login inesperado: HTTP " + login.statusCode());
        HttpResponse<String> sess = client.send(HttpRequest.newBuilder(URI.create(baseUrl + loc)).GET().timeout(Duration.ofSeconds(30)).build(), HttpResponse.BodyHandlers.ofString());
        if (!sess.body().contains("estado=\"1\"") && !sess.body().contains("estado='1'"))
            throw new IllegalStateException("Login rechazado por la federación");
    }

    private String fetchJornada(HttpClient client, String competicion, String grupo, String temporada, int round) throws Exception {
        String url = baseUrl + "/nfg/NPcd/NFG_CmpJornada?cod_primaria=" + urlEncode(codPrimaria)
                + "&CodCompeticion=" + urlEncode(competicion) + "&CodGrupo=" + urlEncode(grupo)
                + "&CodTemporada=" + urlEncode(temporada) + "&CodJornada=" + round
                + "&cod_agrupacion=" + urlEncode(codAgrupacion) + "&Sch_Tipo_Juego=" + urlEncode(tipoJuego);
        HttpResponse<byte[]> resp = client.send(HttpRequest.newBuilder(URI.create(url)).GET().timeout(Duration.ofSeconds(30)).build(), HttpResponse.BodyHandlers.ofByteArray());
        if (resp.statusCode() != 200) throw new IllegalStateException("FFM jornada HTTP " + resp.statusCode());
        return decode(resp.body());
    }

    private String fetchActa(HttpClient client, String codacta) throws Exception {
        String url = baseUrl + "/nfg/NPcd/NFG_CmpPartido?cod_primaria=1000128&CodActa=" + codacta + "&cod_acta=" + codacta;
        HttpResponse<byte[]> resp = client.send(HttpRequest.newBuilder(URI.create(url)).GET().timeout(Duration.ofSeconds(30)).build(), HttpResponse.BodyHandlers.ofByteArray());
        if (resp.statusCode() != 200) throw new IllegalStateException("Acta HTTP " + resp.statusCode());
        return decodeActa(resp.body());
    }

    private static String decode(byte[] bytes) {
        CharsetDecoder dec = StandardCharsets.UTF_8.newDecoder().onMalformedInput(CodingErrorAction.REPORT).onUnmappableCharacter(CodingErrorAction.REPORT);
        try { return dec.decode(ByteBuffer.wrap(bytes)).toString(); } catch (CharacterCodingException e) { return new String(bytes, java.nio.charset.Charset.forName("windows-1252")); }
    }
    private static String decodeActa(byte[] bytes) {
        try { return new String(bytes, StandardCharsets.UTF_8); } catch (Exception e) {}
        try { return new String(bytes, java.nio.charset.Charset.forName("iso-8859-15")); } catch (Exception e) { return new String(bytes, java.nio.charset.Charset.forName("windows-1252")); }
    }

    private List<Integer> roundRange(String html) {
        Pattern p = Pattern.compile("<option[^>]*value=\"(\\d+)\"[^>]*>\\s*\\d+\\s*-", Pattern.CASE_INSENSITIVE);
        Matcher m = p.matcher(html);
        Set<Integer> s = new TreeSet<>();
        while (m.find()) s.add(Integer.parseInt(m.group(1)));
        return new ArrayList<>(s);
    }

    private List<String> extractCodactas(String html) {
        Matcher m = RE_CODACTA.matcher(html);
        LinkedHashSet<String> out = new LinkedHashSet<>();
        while (m.find()) out.add(m.group(1));
        return new ArrayList<>(out);
    }

    private Map<String,Integer> parseActaRoster(String html) {
        // encontrar los dos bloques de equipo por tituloprograma
        List<String> names = new ArrayList<>();
        Matcher tm = RE_EQUIPOS.matcher(html);
        while (tm.find()) names.add(clean(tm.group(1)));
        List<Integer> pos = new ArrayList<>();
        Matcher pm = RE_EQUIPOS.matcher(html);
        while (pm.find()) pos.add(pm.start());
        String localBlock = ""; String awayBlock = ""; String home = names.size()>0?names.get(0):""; String away = names.size()>1?names.get(1):"";
        if (pos.size() >= 2) {
            int golesPos = html.indexOf("GOLES");
            if (golesPos < 0) golesPos = html.length();
            localBlock = html.substring(pos.get(0), pos.get(1));
            awayBlock = html.substring(pos.get(1), Math.min(golesPos, html.length()));
        } else {
            localBlock = html;
        }
        // decidir qué bloque es el nuestro (contiene LISIADOS)
        boolean localOurs = home.toUpperCase().contains("LISIADOS") || home.toUpperCase().contains("REAL");
        // si no detectamos, buscar bloque que contenga al menos un dorsal+nombre y que el otro no
        String targetBlock;
        if (localOurs) targetBlock = localBlock;
        else {
            boolean awayOurs = away.toUpperCase().contains("LISIADOS");
            targetBlock = awayOurs ? awayBlock : "";
            if (targetBlock.isEmpty()) {
                // fallback: si solo un bloque tiene jugadores, usar ese; si ambos, preferir local
                long c1 = RE_PLAYER_ROW.matcher(localBlock).results().count();
                long c2 = RE_PLAYER_ROW.matcher(awayBlock).results().count();
                targetBlock = c1 >= c2 ? localBlock : awayBlock;
                // si ninguno parece nuestro, devolver vacío para no contaminar
                if (!localBlock.toUpperCase().contains("LISIADOS") && !awayBlock.toUpperCase().contains("LISIADOS") && c1>0 && c2>0) {
                    // intentar detectar por primer titular que coincida con dorsal conocido? simplificar: tomar ambos?
                    // para roster histórico queremos solo nuestro equipo, así que si no hay LISIADOS, ignorar
                    if (!home.toUpperCase().contains("LISIADOS") && !away.toUpperCase().contains("LISIADOS")) return Map.of();
                }
            }
        }
        Map<String,Integer> out = new LinkedHashMap<>();
        // Titulares + suplentes dentro del bloque
        Matcher pr = RE_PLAYER_ROW.matcher(targetBlock);
        while (pr.find()) {
            int dorsal = Integer.parseInt(pr.group(1));
            String nombre = clean(pr.group(2));
            if (nombre == null || nombre.length() < 3) continue;
            // filtrar cuerpo técnico que a veces aparece con dorsal 0
            if (nombre.toUpperCase().contains("ENTRENADOR") || nombre.toUpperCase().contains("DELEGADO")) continue;
            out.putIfAbsent(nombre, dorsal);
        }
        return out;
    }

    private boolean isExpectedActa(String html, String rival) {
        List<String> teams = new ArrayList<>();
        Matcher matcher = RE_EQUIPOS.matcher(html);
        while (matcher.find()) {
            String team = clean(matcher.group(1));
            if (team != null) teams.add(normalize(team));
        }
        if (teams.size() < 2) return false;

        boolean hasOurTeam = teams.stream().anyMatch(team -> team.contains("LISIADOS"));
        String normalizedRival = normalize(rival);
        boolean hasRival = normalizedRival.isBlank()
                || teams.stream().anyMatch(team -> team.equals(normalizedRival)
                || team.contains(normalizedRival)
                || normalizedRival.contains(team));
        return hasOurTeam && hasRival;
    }

    private boolean hasOurTeam(String html) {
        Matcher matcher = RE_EQUIPOS.matcher(html);
        while (matcher.find()) {
            String team = normalize(clean(matcher.group(1)));
            if (team.contains("LISIADOS")) return true;
        }
        return false;
    }

    private static String clean(String s) {
        if (s==null) return null;
        s = s.replaceAll("<[^>]+>", " ");
        s = s.replaceAll("&nbsp;", " ");
        s = java.net.URLDecoder.decode(s, StandardCharsets.UTF_8);
        s = s.replaceAll("\\s+", " ").trim();
        // unescape html
        s = s.replaceAll("&amp;", "&");
        return s.isEmpty()?null:s;
    }
    private static String normalize(String s) {
        return s == null ? "" : java.text.Normalizer.normalize(s, java.text.Normalizer.Form.NFD).replaceAll("\\p{M}", "").toUpperCase().replaceAll("[^A-Z0-9 ]", " ").replaceAll("\\s+", " ").trim();
    }
    private static String[] splitName(String full) {
        String[] parts = full.trim().split("\\s+");
        if (parts.length <= 2) return new String[]{parts[0], parts.length>1?parts[1]:""};
        // primer token = nombre, resto = apellidos (heurística)
        String name = parts[0];
        // si segundo es compuesto tipo JOSE, incluir
        if (parts.length >= 3 && parts[1].length() <= 4) {
            name = parts[0] + " " + parts[1];
            String surnames = String.join(" ", Arrays.copyOfRange(parts, 2, parts.length));
            return new String[]{name, surnames};
        }
        String surnames = String.join(" ", Arrays.copyOfRange(parts, 1, parts.length));
        return new String[]{name, surnames};
    }
    private String urlEncode(String v) { return URLEncoder.encode(v==null?"":v, StandardCharsets.UTF_8); }
}
