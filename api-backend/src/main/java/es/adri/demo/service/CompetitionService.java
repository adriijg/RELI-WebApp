package es.adri.demo.service;

import es.adri.demo.dto.CompetitionDTO;
import es.adri.demo.dto.CompetitionRequestDTO;
import es.adri.demo.dto.PagedResponseDTO;
import es.adri.demo.dto.StandingDTO;
import es.adri.demo.exception.ResourceNotFoundException;
import es.adri.demo.model.Competition;
import es.adri.demo.model.CompetitionType;
import es.adri.demo.model.Match;
import es.adri.demo.model.MatchPhase;
import es.adri.demo.model.MatchStatus;
import es.adri.demo.model.NeutralMatch;
import es.adri.demo.model.Season;
import es.adri.demo.repository.CompetitionRepository;
import es.adri.demo.repository.MatchRepository;
import es.adri.demo.repository.NeutralMatchRepository;
import es.adri.demo.repository.SeasonRepository;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class CompetitionService {

    private static final String OUR_TEAM_NAME = "REAL LISIADOS";
    private static final String OUR_TEAM_KEY = canonicalTeamKey(OUR_TEAM_NAME);

    private final CompetitionRepository competitionRepository;
    private final SeasonRepository seasonRepository;
    private final MatchRepository matchRepository;
    private final NeutralMatchRepository neutralMatchRepository;

    public CompetitionService(CompetitionRepository competitionRepository, SeasonRepository seasonRepository,
                              MatchRepository matchRepository, NeutralMatchRepository neutralMatchRepository) {
        this.competitionRepository = competitionRepository;
        this.seasonRepository = seasonRepository;
        this.matchRepository = matchRepository;
        this.neutralMatchRepository = neutralMatchRepository;
    }

    @Cacheable(value = "competitions", key = "#pageable.pageNumber + '-' + #pageable.pageSize + '-' + #pageable.sort.toString()")
    public PagedResponseDTO<CompetitionDTO> findAllCompetitions(Pageable pageable) {
        Page<CompetitionDTO> page = competitionRepository.findAll(pageable)
                .map(this::toDto);
        return toPagedResponse(page);
    }

    public PagedResponseDTO<CompetitionDTO> findCompetitionsBySearch(String search, Pageable pageable) {
        Page<CompetitionDTO> page = competitionRepository.findBySearch(search, pageable)
                .map(this::toDto);
        return toPagedResponse(page);
    }

    public CompetitionDTO findCompetitionById(Long id) {
        return toDto(getCompetitionById(id));
    }

    @CacheEvict(value = {"competitions", "standings"}, allEntries = true)
    @Transactional
    public CompetitionDTO createCompetition(CompetitionRequestDTO competitionRequestDTO) {
        Competition competition = new Competition();
        mapRequestToEntity(competitionRequestDTO, competition);
        return toDto(competitionRepository.save(competition));
    }

    @CacheEvict(value = {"competitions", "standings"}, allEntries = true)
    @Transactional
    public CompetitionDTO updateCompetition(Long id, CompetitionRequestDTO competitionRequestDTO) {
        Competition competition = getCompetitionById(id);
        mapRequestToEntity(competitionRequestDTO, competition);
        return toDto(competitionRepository.save(competition));
    }

    @CacheEvict(value = {"competitions", "standings"}, allEntries = true)
    @Transactional
    public void deleteCompetition(Long id) {
        competitionRepository.delete(getCompetitionById(id));
    }

    @Cacheable(value = "standings", key = "#competitionId + '-' + (#jornada == null ? 'all' : #jornada)")
    public List<StandingDTO> getStandings(Long competitionId, Integer jornada) {
        Competition competition = getCompetitionById(competitionId);
        List<Match> matches = matchRepository.findByCompetitionId(competition.getId()).stream()
                .filter(match -> match.getPhase() == null || match.getPhase() == MatchPhase.LIGUILLA)
                .toList();
        Set<String> ourGroups = matches.stream()
                .map(Match::getGroupName)
                .filter(name -> name != null && !name.isBlank())
                .map(CompetitionService::normalizeGroupName)
                .collect(Collectors.toSet());
        List<NeutralMatch> neutralMatches = neutralMatchRepository.findByCompetitionId(competition.getId()).stream()
                .filter(match -> match.getPhase() == null || match.getPhase() == MatchPhase.LIGUILLA)
                .filter(match -> ourGroups.isEmpty()
                        || match.getGroupName() == null || match.getGroupName().isBlank()
                        || ourGroups.contains(normalizeGroupName(match.getGroupName())))
                .toList();
        if (competition.getType() == CompetitionType.COPA && matches.isEmpty() && neutralMatches.isEmpty()) {
            return List.of();
        }

        Map<String, StandingDTO> table = new LinkedHashMap<>();
        table.put(OUR_TEAM_KEY, new StandingDTO(OUR_TEAM_NAME, true, 0, 0, 0, 0, 0, 0, 0, 0, ""));
        Map<String, StringBuilder> forms = new LinkedHashMap<>();
        forms.put(OUR_TEAM_KEY, new StringBuilder());

        // Primera pasada: registrar todos los equipos aunque sean de jornadas futuras
        for (Match match : matches) {
            registerTeam(table, forms, match.getRival());
        }
        for (NeutralMatch match : neutralMatches) {
            if (isOurTeam(match.getHomeName()) || isOurTeam(match.getAwayName())) {
                continue;
            }
            registerTeam(table, forms, match.getHomeName());
            registerTeam(table, forms, match.getAwayName());
        }

        // Segunda pasada: puntuar solo hasta la jornada pedida, en orden cronologico
        List<Match> scored = matches.stream()
                .filter(m -> jornada == null || m.getJornada() == null || m.getJornada() <= jornada)
                .filter(m -> m.getStatus() == MatchStatus.FINISHED)
                .filter(m -> m.getOurGoals() != null && m.getRivalGoals() != null)
                .filter(m -> {
                    if (isOurTeam(m.getRival())) return false;
                    String rivalKey = canonicalTeamKey(m.getRival());
                    return !rivalKey.isEmpty() && table.containsKey(rivalKey);
                })
                .sorted(Comparator.comparing(Match::getDate, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(Match::getId, Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());
        for (Match match : scored) {
            String rivalKey = canonicalTeamKey(match.getRival());
            int ourGoals = match.getOurGoals();
            int rivalGoals = match.getRivalGoals();
            applyResult(table.get(OUR_TEAM_KEY), forms.get(OUR_TEAM_KEY), ourGoals, rivalGoals);
            applyResult(table.get(rivalKey), forms.get(rivalKey), rivalGoals, ourGoals);
        }

        List<NeutralMatch> scoredNeutrals = neutralMatches.stream()
                .filter(m -> jornada == null || m.getJornada() == null || m.getJornada() <= jornada)
                .filter(m -> m.getStatus() == MatchStatus.FINISHED)
                .filter(m -> m.getHomeGoals() != null && m.getAwayGoals() != null)
                .filter(m -> !isOurTeam(m.getHomeName()) && !isOurTeam(m.getAwayName()))
                .filter(m -> table.containsKey(canonicalTeamKey(m.getHomeName()))
                        && table.containsKey(canonicalTeamKey(m.getAwayName())))
                .sorted(Comparator.comparing(NeutralMatch::getDate, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(NeutralMatch::getId, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
        for (NeutralMatch match : scoredNeutrals) {
            String homeKey = canonicalTeamKey(match.getHomeName());
            String awayKey = canonicalTeamKey(match.getAwayName());
            applyResult(table.get(homeKey), forms.get(homeKey), match.getHomeGoals(), match.getAwayGoals());
            applyResult(table.get(awayKey), forms.get(awayKey), match.getAwayGoals(), match.getHomeGoals());
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

    private void registerTeam(Map<String, StandingDTO> table, Map<String, StringBuilder> forms, String rawName) {
        String name = cleanTeamName(rawName);
        String key = canonicalTeamKey(name);
        if (key.isEmpty() || isOurTeam(name)) {
            return;
        }
        table.computeIfAbsent(key, ignored -> new StandingDTO(name, false, 0, 0, 0, 0, 0, 0, 0, 0, ""));
        forms.computeIfAbsent(key, ignored -> new StringBuilder());
    }

    private static String cleanTeamName(String value) {
        return value == null ? "" : value.trim().replaceAll("\\s+", " ");
    }

    private static String canonicalTeamKey(String value) {
        String normalized = Normalizer.normalize(cleanTeamName(value), Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]", "");
        return normalized;
    }

    private static String normalizeGroupName(String value) {
        String normalized = value == null ? "" : value.trim().toLowerCase();
        if (normalized.startsWith("grupo")) {
            normalized = normalized.substring(5).trim();
        }
        return normalized;
    }

    private static boolean isOurTeam(String value) {
        return cleanTeamName(value).toUpperCase().contains("LISIADOS");
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
