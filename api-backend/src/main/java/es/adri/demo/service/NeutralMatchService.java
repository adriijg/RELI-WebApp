package es.adri.demo.service;

import es.adri.demo.dto.NeutralMatchDTO;
import es.adri.demo.model.Competition;
import es.adri.demo.model.MatchStatus;
import es.adri.demo.model.NeutralMatch;
import es.adri.demo.repository.CompetitionRepository;
import es.adri.demo.repository.NeutralMatchRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class NeutralMatchService {

    private final NeutralMatchRepository repository;
    private final CompetitionRepository competitionRepository;

    public NeutralMatchService(NeutralMatchRepository repository, CompetitionRepository competitionRepository) {
        this.repository = repository;
        this.competitionRepository = competitionRepository;
    }

    @Transactional(readOnly = true)
    public List<NeutralMatchDTO> list(Long competitionId, Integer jornada) {
        List<NeutralMatch> matches = jornada == null
                ? repository.findByCompetitionId(competitionId)
                : repository.findByCompetitionIdAndJornada(competitionId, jornada);
        return matches.stream().map(this::toDto).toList();
    }

    /** Crea o actualiza por (competición, jornada, códigos): idempotente para el editor de jornada. */
    @Transactional
    public NeutralMatchDTO upsert(NeutralMatchDTO dto) {
        if (dto.getCompetitionId() == null || dto.getJornada() == null
                || dto.getHomeName() == null || dto.getHomeName().isBlank()
                || dto.getAwayName() == null || dto.getAwayName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Faltan competición, jornada o equipos");
        }
        Competition competition = competitionRepository.findById(dto.getCompetitionId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Competición no encontrada"));

        NeutralMatch match;
        if (dto.getId() != null) {
            match = repository.findById(dto.getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Partido no encontrado"));
        } else if (dto.getHomeCode() != null && dto.getAwayCode() != null) {
            Optional<NeutralMatch> existing = repository.findByCompetitionIdAndJornadaAndHomeCodeAndAwayCode(
                    dto.getCompetitionId(), dto.getJornada(), dto.getHomeCode(), dto.getAwayCode());
            match = existing.orElseGet(NeutralMatch::new);
        } else {
            match = new NeutralMatch();
        }
        match.setCompetition(competition);
        match.setJornada(dto.getJornada());
        match.setHomeName(dto.getHomeName().trim());
        match.setAwayName(dto.getAwayName().trim());
        match.setHomeCode(blankToNull(dto.getHomeCode()));
        match.setAwayCode(blankToNull(dto.getAwayCode()));
        match.setDate(parseDate(dto.getDate()));
        match.setVenue(blankToNull(dto.getVenue()));
        match.setStatus(dto.getStatus() == null ? MatchStatus.SCHEDULED : dto.getStatus());
        match.setHomeGoals(dto.getHomeGoals());
        match.setAwayGoals(dto.getAwayGoals());
        match.setCodacta(blankToNull(dto.getCodacta()));
        return toDto(repository.save(match));
    }

    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Partido no encontrado");
        }
        repository.deleteById(id);
    }

    private NeutralMatchDTO toDto(NeutralMatch match) {
        return new NeutralMatchDTO(
                match.getId(),
                match.getCompetition() != null ? match.getCompetition().getId() : null,
                match.getJornada(),
                match.getHomeName(),
                match.getAwayName(),
                match.getHomeCode(),
                match.getAwayCode(),
                match.getDate() == null ? null : match.getDate().toString(),
                match.getVenue(),
                match.getStatus(),
                match.getHomeGoals(),
                match.getAwayGoals(),
                match.getCodacta());
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static LocalDateTime parseDate(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return LocalDateTime.parse(value.trim());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fecha no válida (usa YYYY-MM-DDTHH:MM)");
        }
    }
}
