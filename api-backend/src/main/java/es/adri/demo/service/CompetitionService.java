package es.adri.demo.service;

import es.adri.demo.dto.CompetitionDTO;
import es.adri.demo.dto.CompetitionRequestDTO;
import es.adri.demo.dto.PagedResponseDTO;
import es.adri.demo.dto.StandingDTO;
import es.adri.demo.exception.ResourceNotFoundException;
import es.adri.demo.model.Competition;
import es.adri.demo.model.Match;
import es.adri.demo.model.MatchStatus;
import es.adri.demo.model.Season;
import es.adri.demo.repository.CompetitionRepository;
import es.adri.demo.repository.MatchRepository;
import es.adri.demo.repository.SeasonRepository;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class CompetitionService {

    private static final String OUR_TEAM_NAME = "REAL LISIADOS";

    private final CompetitionRepository competitionRepository;
    private final SeasonRepository seasonRepository;
    private final MatchRepository matchRepository;

    public CompetitionService(CompetitionRepository competitionRepository, SeasonRepository seasonRepository,
                              MatchRepository matchRepository) {
        this.competitionRepository = competitionRepository;
        this.seasonRepository = seasonRepository;
        this.matchRepository = matchRepository;
    }

    public PagedResponseDTO<CompetitionDTO> findAllCompetitions(Pageable pageable) {
        Page<CompetitionDTO> page = competitionRepository.findAll(pageable)
                .map(this::toDto);
        return toPagedResponse(page);
    }

    public CompetitionDTO findCompetitionById(Long id) {
        return toDto(getCompetitionById(id));
    }

    @Transactional
    public CompetitionDTO createCompetition(CompetitionRequestDTO competitionRequestDTO) {
        Competition competition = new Competition();
        mapRequestToEntity(competitionRequestDTO, competition);
        return toDto(competitionRepository.save(competition));
    }

    @Transactional
    public CompetitionDTO updateCompetition(Long id, CompetitionRequestDTO competitionRequestDTO) {
        Competition competition = getCompetitionById(id);
        mapRequestToEntity(competitionRequestDTO, competition);
        return toDto(competitionRepository.save(competition));
    }

    @Transactional
    public void deleteCompetition(Long id) {
        competitionRepository.delete(getCompetitionById(id));
    }

    public List<StandingDTO> getStandings(Long competitionId, Integer jornada) {
        Competition competition = getCompetitionById(competitionId);
        List<Match> matches = matchRepository.findByCompetitionId(competition.getId());

        Map<String, StandingDTO> table = new LinkedHashMap<>();
        table.put(OUR_TEAM_NAME, new StandingDTO(OUR_TEAM_NAME, true, 0, 0, 0, 0, 0, 0, 0, 0, ""));
        Map<String, StringBuilder> forms = new LinkedHashMap<>();
        forms.put(OUR_TEAM_NAME, new StringBuilder());

        // Primera pasada: registrar todos los equipos aunque sean de jornadas futuras
        for (Match match : matches) {
            String rival = match.getRival() == null ? "" : match.getRival().trim();
            if (rival.isEmpty()) {
                continue;
            }
            table.computeIfAbsent(rival, name -> new StandingDTO(name, false, 0, 0, 0, 0, 0, 0, 0, 0, ""));
            forms.computeIfAbsent(rival, name -> new StringBuilder());
        }

        // Segunda pasada: puntuar solo hasta la jornada pedida, en orden cronologico
        List<Match> scored = matches.stream()
                .filter(m -> jornada == null || m.getJornada() == null || m.getJornada() <= jornada)
                .filter(m -> m.getStatus() == MatchStatus.FINISHED)
                .filter(m -> m.getOurGoals() != null && m.getRivalGoals() != null)
                .filter(m -> {
                    String rival = m.getRival() == null ? "" : m.getRival().trim();
                    return !rival.isEmpty() && table.containsKey(rival);
                })
                .sorted(Comparator.comparing(Match::getDate, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(Match::getId, Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());
        for (Match match : scored) {
            String rival = match.getRival().trim();
            int ourGoals = match.getOurGoals();
            int rivalGoals = match.getRivalGoals();
            applyResult(table.get(OUR_TEAM_NAME), forms.get(OUR_TEAM_NAME), ourGoals, rivalGoals);
            applyResult(table.get(rival), forms.get(rival), rivalGoals, ourGoals);
        }
        for (Map.Entry<String, StandingDTO> entry : table.entrySet()) {
            String form = forms.get(entry.getKey()).toString();
            entry.getValue().setForm(form.length() > 5 ? form.substring(form.length() - 5) : form);
        }

        List<StandingDTO> standings = new ArrayList<>(table.values());
        standings.sort(Comparator.comparingInt(StandingDTO::getPoints).reversed()
                .thenComparing(Comparator.comparingInt(StandingDTO::getGoalDifference).reversed())
                .thenComparing(Comparator.comparingInt(StandingDTO::getGoalsFor).reversed())
                .thenComparing(StandingDTO::getTeamName));
        return standings;
    }

    private void applyResult(StandingDTO row, StringBuilder form, int scored, int conceded) {
        row.setPlayed(row.getPlayed() + 1);
        row.setGoalsFor(row.getGoalsFor() + scored);
        row.setGoalsAgainst(row.getGoalsAgainst() + conceded);
        row.setGoalDifference(row.getGoalsFor() - row.getGoalsAgainst());
        if (scored > conceded) {
            row.setWon(row.getWon() + 1);
            row.setPoints(row.getPoints() + 3);
            form.append('V');
        } else if (scored == conceded) {
            row.setDrawn(row.getDrawn() + 1);
            row.setPoints(row.getPoints() + 1);
            form.append('E');
        } else {
            row.setLost(row.getLost() + 1);
            form.append('D');
        }
    }

    private Competition getCompetitionById(Long id) {
        return competitionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Competicion no encontrada"));
    }

    private Season getSeasonById(Long seasonId) {
        return seasonRepository.findById(seasonId)
                .orElseThrow(() -> new ResourceNotFoundException("Temporada no encontrada"));
    }

    private void mapRequestToEntity(CompetitionRequestDTO competitionRequestDTO, Competition competition) {
        competition.setName(competitionRequestDTO.getName());
        competition.setType(competitionRequestDTO.getType());
        competition.setSeason(getSeasonById(competitionRequestDTO.getSeasonId()));
        competition.setFfmCompeticion(trimToNull(competitionRequestDTO.getFfmCompeticion()));
        competition.setFfmGrupo(trimToNull(competitionRequestDTO.getFfmGrupo()));
        competition.setFfmTemporada(trimToNull(competitionRequestDTO.getFfmTemporada()));
        competition.setFfmOurCode(trimToNull(competitionRequestDTO.getFfmOurCode()));
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private CompetitionDTO toDto(Competition competition) {
        return new CompetitionDTO(
                competition.getId(),
                competition.getName(),
                competition.getType(),
                competition.getSeason().getId(),
                competition.getSeason().getName(),
                competition.getFfmCompeticion(),
                competition.getFfmGrupo(),
                competition.getFfmTemporada(),
                competition.getFfmOurCode()
        );
    }

    private PagedResponseDTO<CompetitionDTO> toPagedResponse(Page<CompetitionDTO> page) {
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
