package es.adri.demo.service;

import es.adri.demo.dto.QuintetBallotDTO;
import es.adri.demo.dto.QuintetRankDTO;
import es.adri.demo.dto.QuintetTallyDTO;
import es.adri.demo.dto.QuintetVoteRequestDTO;
import es.adri.demo.model.QuintetVote;
import es.adri.demo.model.User;
import es.adri.demo.repository.PlayerRepository;
import es.adri.demo.repository.QuintetVoteRepository;
import es.adri.demo.repository.UserRepository;
import java.time.DayOfWeek;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Service
@Transactional
public class QuintetVoteService {

    private static final ZoneId MADRID = ZoneId.of("Europe/Madrid");

    private final QuintetVoteRepository voteRepository;
    private final UserRepository userRepository;
    private final PlayerRepository playerRepository;

    public QuintetVoteService(
            QuintetVoteRepository voteRepository,
            UserRepository userRepository,
            PlayerRepository playerRepository
    ) {
        this.voteRepository = voteRepository;
        this.userRepository = userRepository;
        this.playerRepository = playerRepository;
    }

    public QuintetBallotDTO save(QuintetVoteRequestDTO request) {
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
        return new QuintetTallyDTO(votes.size(), published(), quintet, ranking);
    }

    public boolean published() {
        DayOfWeek day = java.time.LocalDate.now(MADRID).getDayOfWeek();
        return day != DayOfWeek.MONDAY;
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
