package es.adri.demo.service;

import es.adri.demo.dto.QuintetBallotDTO;
import es.adri.demo.dto.QuintetRankDTO;
import es.adri.demo.dto.QuintetSeasonTallyDTO;
import es.adri.demo.dto.QuintetTallyDTO;
import es.adri.demo.dto.QuintetVoteRequestDTO;
import es.adri.demo.dto.QuintetStatusDTO;
import es.adri.demo.model.Player;
import es.adri.demo.model.Position;
import es.adri.demo.model.QuintetConfig;
import es.adri.demo.model.QuintetVote;
import es.adri.demo.model.User;
import es.adri.demo.repository.PlayerRepository;
import es.adri.demo.repository.QuintetConfigRepository;
import es.adri.demo.repository.QuintetVoteRepository;
import es.adri.demo.repository.UserRepository;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Service
@Transactional
public class QuintetVoteService {

    private static final ZoneId MADRID = ZoneId.of("Europe/Madrid");

    private final QuintetVoteRepository voteRepository;
    private final QuintetConfigRepository configRepository;
    private final UserRepository userRepository;
    private final PlayerRepository playerRepository;

    public QuintetVoteService(
            QuintetVoteRepository voteRepository,
            QuintetConfigRepository configRepository,
            UserRepository userRepository,
            PlayerRepository playerRepository
    ) {
        this.voteRepository = voteRepository;
        this.configRepository = configRepository;
        this.userRepository = userRepository;
        this.playerRepository = playerRepository;
    }

    public QuintetStatusDTO open(Long seasonId, Integer jornada) {
        QuintetConfig config = configRepository.findBySeasonIdAndJornada(seasonId, jornada)
                .orElseGet(() -> {
                    QuintetConfig c = new QuintetConfig();
                    c.setSeasonId(seasonId);
                    c.setJornada(jornada);
                    return c;
                });
        config.setOpen(true);
        configRepository.save(config);
        return toStatus(config);
    }

    public QuintetStatusDTO close(Long seasonId, Integer jornada) {
        QuintetConfig config = configRepository.findBySeasonIdAndJornada(seasonId, jornada)
                .orElseGet(() -> {
                    QuintetConfig c = new QuintetConfig();
                    c.setSeasonId(seasonId);
                    c.setJornada(jornada);
                    return c;
                });
        config.setOpen(false);
        configRepository.save(config);
        return toStatus(config);
    }

    public QuintetStatusDTO status(Long seasonId, Integer jornada) {
        QuintetConfig config = configRepository.findBySeasonIdAndJornada(seasonId, jornada).orElse(null);
        if (config == null) {
            QuintetConfig tmp = new QuintetConfig();
            tmp.setSeasonId(seasonId);
            tmp.setJornada(jornada);
            tmp.setOpen(false);
            return toStatus(tmp);
        }
        return toStatus(config);
    }

    public boolean isOpen(Long seasonId, Integer jornada) {
        return configRepository.findBySeasonIdAndJornada(seasonId, jornada)
                .map(QuintetConfig::getOpen)
                .orElse(false);
    }

    private LocalDateTime nextThursdayClosesAt() {
        LocalDate today = LocalDate.now(MADRID);
        int daysUntilThursday = (DayOfWeek.THURSDAY.getValue() - today.getDayOfWeek().getValue() + 7) % 7;
        if (daysUntilThursday == 0) {
            // si hoy es jueves, cierra hoy a las 23:59
            // si ya pasó hoy 23:59, sería la próxima semana, pero el scheduler ya habrá cerrado
        }
        LocalDate thursday = today.plusDays(daysUntilThursday);
        LocalDateTime closes = LocalDateTime.of(thursday, LocalTime.of(23, 59, 59));
        return closes;
    }

    private QuintetStatusDTO toStatus(QuintetConfig config) {
        LocalDateTime closesAt = config.getOpen() ? nextThursdayClosesAt() : null;
        return new QuintetStatusDTO(config.getSeasonId(), config.getJornada(), Boolean.TRUE.equals(config.getOpen()), closesAt);
    }

    @Scheduled(cron = "0 59 23 * * THU", zone = "Europe/Madrid")
    @Transactional
    public void autoCloseThursdays() {
        List<QuintetConfig> openConfigs = configRepository.findByOpenTrue();
        for (QuintetConfig config : openConfigs) {
            config.setOpen(false);
            configRepository.save(config);
        }
    }

    public QuintetBallotDTO save(QuintetVoteRequestDTO request) {
        if (!isOpen(request.getSeasonId(), request.getJornada())) {
            throw new ResponseStatusException(BAD_REQUEST, "La votación está cerrada. Espera a que el admin la abra.");
        }
        List<Long> playerIds = request.getPlayerIds();
        if (playerIds.stream().distinct().count() != 5) {
            throw new ResponseStatusException(BAD_REQUEST, "El quinteto necesita cinco jugadores distintos");
        }
        if (playerIds.stream().anyMatch(id -> playerRepository.findById(id).isEmpty())) {
            throw new ResponseStatusException(BAD_REQUEST, "Hay un jugador que no existe");
        }

        User user = currentUser();
        QuintetVote vote = voteRepository
                .findByUserIdAndSeasonIdAndJornada(user.getId(), request.getSeasonId(), request.getJornada())
                .orElseGet(QuintetVote::new);
        vote.setUser(user);
        vote.setSeasonId(request.getSeasonId());
        vote.setJornada(request.getJornada());
        vote.setMatchId(request.getMatchId());
        vote.setPlayerIds(playerIds);
        return toBallot(voteRepository.save(vote));
    }

    public QuintetBallotDTO mine(Long seasonId, Integer jornada) {
        User user = currentUser();
        return voteRepository.findByUserIdAndSeasonIdAndJornada(user.getId(), seasonId, jornada)
                .map(this::toBallot)
                .orElse(null);
    }

    public void deleteMine(Long seasonId, Integer jornada) {
        User user = currentUser();
        voteRepository.findByUserIdAndSeasonIdAndJornada(user.getId(), seasonId, jornada)
                .ifPresent(voteRepository::delete);
    }

    public List<QuintetBallotDTO> ballots(Long seasonId, Integer jornada) {
        return voteRepository.findBySeasonIdAndJornadaOrderByCreatedAtAsc(seasonId, jornada).stream()
                .map(this::toBallot)
                .toList();
    }

    public QuintetTallyDTO tally(Long seasonId, Integer jornada) {
        Map<Long, Integer> counts = new LinkedHashMap<>();
        List<QuintetVote> votes = voteRepository.findBySeasonIdAndJornadaOrderByCreatedAtAsc(seasonId, jornada);
        for (QuintetVote vote : votes) {
            for (Long playerId : vote.playerIds()) {
                counts.merge(playerId, 1, Integer::sum);
            }
        }
        List<QuintetRankDTO> ranking = new ArrayList<>();
        counts.forEach((playerId, total) -> ranking.add(new QuintetRankDTO(playerId, total)));
        ranking.sort(Comparator.comparingInt(QuintetRankDTO::getVotes).reversed()
                .thenComparing(QuintetRankDTO::getPlayerId));
        List<QuintetRankDTO> quintet = ranking.stream().limit(5).toList();
        boolean pub = !isOpen(seasonId, jornada);
        // fallback: si nunca se abrió, mantener el comportamiento antiguo (publicado salvo lunes)
        if (!configRepository.findBySeasonIdAndJornada(seasonId, jornada).isPresent()) {
            pub = published();
        }
        return new QuintetTallyDTO(votes.size(), pub, quintet, ranking);
    }

    public boolean published() {
        DayOfWeek day = java.time.LocalDate.now(MADRID).getDayOfWeek();
        return day != DayOfWeek.MONDAY;
    }

    public QuintetSeasonTallyDTO seasonTally(Long seasonId) {
        List<QuintetVote> votes = voteRepository.findBySeasonId(seasonId);
        Map<Long, Integer> counts = new LinkedHashMap<>();
        for (QuintetVote vote : votes) {
            for (Long playerId : vote.playerIds()) {
                counts.merge(playerId, 1, Integer::sum);
            }
        }
        List<QuintetRankDTO> ranking = new ArrayList<>();
        counts.forEach((playerId, total) -> ranking.add(new QuintetRankDTO(playerId, total)));
        ranking.sort(Comparator.comparingInt(QuintetRankDTO::getVotes).reversed()
                .thenComparing(QuintetRankDTO::getPlayerId));

        // yearly quintet: 4 field players most voted + most voted goalkeeper
        Map<Long, Player> playerMap = new LinkedHashMap<>();
        for (Long pid : counts.keySet()) {
            playerRepository.findById(pid).ifPresent(p -> playerMap.put(pid, p));
        }
        List<QuintetRankDTO> field = ranking.stream()
                .filter(r -> {
                    Player p = playerMap.get(r.getPlayerId());
                    return p == null || p.getPosition() != Position.PORTERO;
                })
                .limit(4)
                .toList();
        List<QuintetRankDTO> keeper = ranking.stream()
                .filter(r -> {
                    Player p = playerMap.get(r.getPlayerId());
                    return p != null && p.getPosition() == Position.PORTERO;
                })
                .limit(1)
                .toList();
        List<QuintetRankDTO> yearlyQuintet = new ArrayList<>();
        yearlyQuintet.addAll(field);
        yearlyQuintet.addAll(keeper);
        // if no keeper or not enough field players, fallback to top 5 overall
        if (yearlyQuintet.size() < 5) {
            yearlyQuintet = ranking.stream().limit(5).toList();
        }

        int totalVotes = counts.values().stream().mapToInt(Integer::intValue).sum();
        return new QuintetSeasonTallyDTO(votes.size(), totalVotes, ranking, yearlyQuintet);
    }

    private QuintetBallotDTO toBallot(QuintetVote vote) {
        return new QuintetBallotDTO(
                vote.getUser().getId(),
                vote.getUser().getUsername(),
                vote.playerIds(),
                vote.getUpdatedAt() != null ? vote.getUpdatedAt() : vote.getCreatedAt()
        );
    }

    private User currentUser() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null || "anonymousUser".equals(authentication.getName())) {
            throw new ResponseStatusException(UNAUTHORIZED, "Entra con tu cuenta para votar");
        }
        return userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "Entra con tu cuenta para votar"));
    }
}
