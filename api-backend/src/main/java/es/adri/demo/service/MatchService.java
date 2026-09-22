package es.adri.demo.service;

import es.adri.demo.dto.MatchDTO;
import es.adri.demo.dto.MatchRequestDTO;
import es.adri.demo.dto.PagedResponseDTO;
import es.adri.demo.dto.MatchDetailDTO;
import es.adri.demo.dto.MatchGoalDTO;
import es.adri.demo.dto.MatchGoalRequestDTO;
import es.adri.demo.dto.MatchCallUpDTO;
import es.adri.demo.dto.MatchCallUpRequestDTO;
import es.adri.demo.dto.RivalInfoDTO;
import es.adri.demo.exception.ResourceNotFoundException;
import es.adri.demo.model.Competition;
import es.adri.demo.model.Match;
import es.adri.demo.model.MatchGoal;
import es.adri.demo.model.MatchCallUp;
import es.adri.demo.model.Player;
import es.adri.demo.repository.CompetitionRepository;
import es.adri.demo.repository.MatchRepository;
import es.adri.demo.repository.MatchGoalRepository;
import es.adri.demo.repository.MatchCallUpRepository;
import es.adri.demo.repository.PlayerRepository;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class MatchService {

    private final MatchRepository matchRepository;
    private final CompetitionRepository competitionRepository;
    private final MatchGoalRepository matchGoalRepository;
    private final MatchCallUpRepository matchCallUpRepository;
    private final PlayerRepository playerRepository;

    public MatchService(
            MatchRepository matchRepository,
            CompetitionRepository competitionRepository,
            MatchGoalRepository matchGoalRepository,
            MatchCallUpRepository matchCallUpRepository,
            PlayerRepository playerRepository
    ) {
        this.matchRepository = matchRepository;
        this.competitionRepository = competitionRepository;
        this.matchGoalRepository = matchGoalRepository;
        this.matchCallUpRepository = matchCallUpRepository;
        this.playerRepository = playerRepository;
    }

    public PagedResponseDTO<MatchDTO> findAllMatches(Pageable pageable) {
        Page<MatchDTO> page = matchRepository.findAll(pageable)
                .map(this::toDto);
        return toPagedResponse(page);
    }

    public List<MatchDTO> findMatchesByCompetitionId(Long competitionId) {
        return matchRepository.findByCompetitionId(competitionId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public MatchDTO findMatchById(Long id) {
        return toDto(getMatchById(id));
    }

    public MatchDetailDTO findMatchDetail(Long id) {
        Match match = getMatchById(id);
        List<MatchGoalDTO> goals = matchGoalRepository.findByMatchIdOrderByIdAsc(id)
                .stream()
                .map(this::toGoalDto)
                .collect(Collectors.toList());
        List<MatchCallUpDTO> callups = matchCallUpRepository.findByMatchIdOrderByIdAsc(id)
                .stream()
                .map(this::toCallUpDto)
                .collect(Collectors.toList());
        RivalInfoDTO rivalInfo = buildRivalInfo(match);
        return new MatchDetailDTO(toDto(match), goals, callups, rivalInfo);
    }

    private RivalInfoDTO buildRivalInfo(Match match) {
        String rival = match.getRival();
        if (rival == null || rival.isBlank()) {
            return new RivalInfoDTO(rival, List.of(), List.of(), 0, 0, 0);
        }

        List<Match> allFinished = matchRepository.findFinishedByRival(rival, match.getId());
        List<MatchDTO> recent = allFinished.stream()
                .limit(5)
                .map(this::toDto)
                .collect(Collectors.toList());

        List<MatchDTO> headToHead = allFinished.stream()
                .map(this::toDto)
                .collect(Collectors.toList());

        int rivalWins = 0;
        int draws = 0;
        int ourWins = 0;
        for (Match m : allFinished) {
            if (m.getOurGoals() == null || m.getRivalGoals() == null) continue;
            boolean isHome = m.isHome();
            int us = isHome ? m.getOurGoals() : m.getRivalGoals();
            int them = isHome ? m.getRivalGoals() : m.getOurGoals();
            if (us > them) ourWins++;
            else if (us < them) rivalWins++;
            else draws++;
        }

        return new RivalInfoDTO(rival, recent, headToHead, rivalWins, draws, ourWins);
    }

    @Transactional
    public MatchGoalDTO addGoal(Long matchId, MatchGoalRequestDTO request) {
        Match match = getMatchById(matchId);
        Player player = getPlayerById(request.getPlayerId());
        MatchGoal goal = new MatchGoal();
        goal.setMatch(match);
        goal.setPlayer(player);
        goal.setMinute(request.getMinute());
        return toGoalDto(matchGoalRepository.save(goal));
    }

    @Transactional
    public void removeGoal(Long matchId, Long goalId) {
        MatchGoal goal = matchGoalRepository.findById(goalId)
                .filter(g -> g.getMatch().getId().equals(matchId))
                .orElseThrow(() -> new ResourceNotFoundException("Gol no encontrado"));
        matchGoalRepository.delete(goal);
    }

    @Transactional
    public MatchCallUpDTO addCallUp(Long matchId, MatchCallUpRequestDTO request) {
        Match match = getMatchById(matchId);
        Long playerId = request.getPlayerId();
        if (matchCallUpRepository.existsByMatchIdAndPlayerId(matchId, playerId)) {
            return matchCallUpRepository.findByMatchIdAndPlayerId(matchId, playerId)
                    .map(this::toCallUpDto)
                    .orElseThrow(() -> new ResourceNotFoundException("Convocado no encontrado"));
        }
        Player player = getPlayerById(playerId);
        MatchCallUp callUp = new MatchCallUp();
        callUp.setMatch(match);
        callUp.setPlayer(player);
        return toCallUpDto(matchCallUpRepository.save(callUp));
    }

    @Transactional
    public void removeCallUp(Long matchId, Long callUpId) {
        MatchCallUp callUp = matchCallUpRepository.findById(callUpId)
                .filter(c -> c.getMatch().getId().equals(matchId))
                .orElseThrow(() -> new ResourceNotFoundException("Convocado no encontrado"));
        matchCallUpRepository.delete(callUp);
    }

    @Transactional
    public MatchDTO createMatch(MatchRequestDTO matchRequestDTO) {
        Match match = new Match();
        mapRequestToEntity(matchRequestDTO, match);
        return toDto(matchRepository.save(match));
    }

    @Transactional
    public MatchDTO updateMatch(Long id, MatchRequestDTO matchRequestDTO) {
        Match match = getMatchById(id);
        mapRequestToEntity(matchRequestDTO, match);
        return toDto(matchRepository.save(match));
    }

    @Transactional
    public void deleteMatch(Long id) {
        matchRepository.deleteGoalsByMatchId(id);
        matchRepository.deleteCallUpsByMatchId(id);
        matchRepository.delete(getMatchById(id));
    }

    private Player getPlayerById(Long playerId) {
        return playerRepository.findById(playerId)
                .orElseThrow(() -> new ResourceNotFoundException("Jugador no encontrado"));
    }

    private MatchGoalDTO toGoalDto(MatchGoal goal) {
        return new MatchGoalDTO(
                goal.getId(),
                goal.getPlayer().getId(),
                goal.getPlayer().getName(),
                goal.getPlayer().getJerseyNumber(),
                goal.getMinute()
        );
    }

    private MatchCallUpDTO toCallUpDto(MatchCallUp callUp) {
        return new MatchCallUpDTO(
                callUp.getId(),
                callUp.getPlayer().getId(),
                callUp.getPlayer().getName(),
                callUp.getPlayer().getJerseyNumber(),
                callUp.getPlayer().getPosition()
        );
    }

    private Match getMatchById(Long id) {
        return matchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Partido no encontrado"));
    }

    private Competition getCompetitionById(Long competitionId) {
        return competitionRepository.findById(competitionId)
                .orElseThrow(() -> new ResourceNotFoundException("Competicion no encontrada"));
    }

    private void mapRequestToEntity(MatchRequestDTO matchRequestDTO, Match match) {
        match.setRival(matchRequestDTO.getRival());
        match.setHome(matchRequestDTO.isHome());
        match.setDate(matchRequestDTO.getDate());
        match.setLocation(matchRequestDTO.getLocation());
        match.setStatus(matchRequestDTO.getStatus());
        match.setOurGoals(matchRequestDTO.getOurGoals());
        match.setRivalGoals(matchRequestDTO.getRivalGoals());
        match.setJornada(matchRequestDTO.getJornada());
        match.setCompetition(getCompetitionById(matchRequestDTO.getCompetitionId()));
    }

    private MatchDTO toDto(Match match) {
        return new MatchDTO(
                match.getId(),
                match.getRival(),
                match.isHome(),
                match.getDate(),
                match.getLocation(),
                match.getStatus(),
                match.getOurGoals(),
                match.getRivalGoals(),
                match.getJornada(),
                match.getCompetition().getId(),
                match.getCompetition().getName()
        );
    }

    private PagedResponseDTO<MatchDTO> toPagedResponse(Page<MatchDTO> page) {
        return new PagedResponseDTO<>(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast()
        );
    }
}
