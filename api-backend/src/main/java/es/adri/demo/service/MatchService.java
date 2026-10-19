package es.adri.demo.service;

import es.adri.demo.dto.MatchDTO;
import es.adri.demo.dto.MatchRequestDTO;
import es.adri.demo.dto.PagedResponseDTO;
import es.adri.demo.dto.MatchDetailDTO;
import es.adri.demo.dto.RivalInfoDTO;
import es.adri.demo.dto.StatDTO;
import es.adri.demo.exception.ResourceNotFoundException;
import es.adri.demo.model.Competition;
import es.adri.demo.model.Match;
import es.adri.demo.model.Stat;
import es.adri.demo.repository.CompetitionRepository;
import es.adri.demo.repository.MatchRepository;
import es.adri.demo.repository.StatRepository;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
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
    private final StatRepository statRepository;
    private final MatchNotificationService matchNotificationService;

    public MatchService(
            MatchRepository matchRepository,
            CompetitionRepository competitionRepository,
            StatRepository statRepository,
            MatchNotificationService matchNotificationService
    ) {
        this.matchRepository = matchRepository;
        this.competitionRepository = competitionRepository;
        this.statRepository = statRepository;
        this.matchNotificationService = matchNotificationService;
    }

    @Cacheable(value = "homeMatches", key = "#pageable.pageNumber + '-' + #pageable.pageSize + '-' + #pageable.sort.toString()")
    public PagedResponseDTO<MatchDTO> findAllMatches(Pageable pageable) {
        Page<MatchDTO> page = matchRepository.findAll(pageable)
                .map(this::toDto);
        return toPagedResponse(page);
    }

    public PagedResponseDTO<MatchDTO> findMatchesByStatus(es.adri.demo.model.MatchStatus status, Pageable pageable) {
        return toPagedResponse(matchRepository.findByStatus(status, pageable).map(this::toDto));
    }

    public PagedResponseDTO<MatchDTO> findMatchesBySearch(String search, Pageable pageable) {
        return toPagedResponse(matchRepository.findBySearch(search, pageable).map(this::toDto));
    }

    @Cacheable(value = "nextMatch")
    public MatchDTO findNextMatch() {
        Page<MatchDTO> page = matchRepository.findAll(PageRequest.of(0, 1, org.springframework.data.domain.Sort.by("date").ascending()))
                .map(this::toDto);
        return page.getContent().isEmpty() ? null : page.getContent().get(0);
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
        List<StatDTO> stats = statRepository.findByMatchId(id).stream()
                .map(this::toStatDto)
                .collect(Collectors.toList());
        RivalInfoDTO rivalInfo = buildRivalInfo(match);
        return new MatchDetailDTO(toDto(match), stats, rivalInfo);
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

    @CacheEvict(value = {"homeMatches", "nextMatch"}, allEntries = true)
    @Transactional
    public MatchDTO createMatch(MatchRequestDTO matchRequestDTO) {
        Match match = new Match();
        mapRequestToEntity(matchRequestDTO, match);
        Match saved = matchRepository.save(match);
        matchNotificationService.notifyIfConfirmed(saved);
        return toDto(saved);
    }

    @CacheEvict(value = {"homeMatches", "nextMatch"}, allEntries = true)
    @Transactional
    public MatchDTO updateMatch(Long id, MatchRequestDTO matchRequestDTO) {
        Match match = getMatchById(id);
        mapRequestToEntity(matchRequestDTO, match);
        Match saved = matchRepository.save(match);
        matchNotificationService.notifyIfConfirmed(saved);
        return toDto(saved);
    }

    @CacheEvict(value = {"homeMatches", "nextMatch"}, allEntries = true)
    @Transactional
    public void deleteMatch(Long id) {
        // Borra las estadísticas asociadas y el partido
        matchRepository.deleteStatsByMatchId(id);
        matchRepository.delete(getMatchById(id));
    }

    private Match getMatchById(Long id) {
        return matchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Partido no encontrado"));
    }

    private Competition getCompetitionById(Long competitionId) {
        return competitionRepository.findById(competitionId)
                .orElseThrow(() -> new ResourceNotFoundException("Competicion no encontrada"));
    }

    private StatDTO toStatDto(Stat stat) {
        return new StatDTO(
                stat.getId(),
                stat.getPlayer().getId(),
                stat.getPlayer().getName(),
                stat.getMatch().getId(),
                stat.getMatch().getRival(),
                stat.getGoals(),
                stat.getAssists(),
                stat.getYellowCards(),
                stat.getRedCards(),
                stat.isMvp(),
                stat.isAttended()
        );
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
