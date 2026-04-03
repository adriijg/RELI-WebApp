package es.adri.demo.service;

import es.adri.demo.dto.MatchDTO;
import es.adri.demo.dto.MatchRequestDTO;
import es.adri.demo.exception.ResourceNotFoundException;
import es.adri.demo.model.Competition;
import es.adri.demo.model.Match;
import es.adri.demo.repository.CompetitionRepository;
import es.adri.demo.repository.MatchRepository;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class MatchService {

    private final MatchRepository matchRepository;
    private final CompetitionRepository competitionRepository;

    public MatchService(MatchRepository matchRepository, CompetitionRepository competitionRepository) {
        this.matchRepository = matchRepository;
        this.competitionRepository = competitionRepository;
    }

    public List<MatchDTO> findAllMatches() {
        return matchRepository.findAll()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public MatchDTO findMatchById(Long id) {
        return toDto(getMatchById(id));
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

    private void mapRequestToEntity(MatchRequestDTO matchRequestDTO, Match match) {
        match.setRival(matchRequestDTO.getRival());
        match.setDate(matchRequestDTO.getDate());
        match.setLocation(matchRequestDTO.getLocation());
        match.setStatus(matchRequestDTO.getStatus());
        match.setOurGoals(matchRequestDTO.getOurGoals());
        match.setRivalGoals(matchRequestDTO.getRivalGoals());
        match.setCompetition(getCompetitionById(matchRequestDTO.getCompetitionId()));
    }

    private MatchDTO toDto(Match match) {
        return new MatchDTO(
                match.getId(),
                match.getRival(),
                match.getDate(),
                match.getLocation(),
                match.getStatus(),
                match.getOurGoals(),
                match.getRivalGoals(),
                match.getCompetition().getId(),
                match.getCompetition().getName()
        );
    }
}
