package es.adri.demo.service;

import es.adri.demo.dto.CompetitionDTO;
import es.adri.demo.dto.CompetitionRequestDTO;
import es.adri.demo.dto.PagedResponseDTO;
import es.adri.demo.exception.ResourceNotFoundException;
import es.adri.demo.model.Competition;
import es.adri.demo.model.Season;
import es.adri.demo.repository.CompetitionRepository;
import es.adri.demo.repository.SeasonRepository;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class CompetitionService {

    private final CompetitionRepository competitionRepository;
    private final SeasonRepository seasonRepository;

    public CompetitionService(CompetitionRepository competitionRepository, SeasonRepository seasonRepository) {
        this.competitionRepository = competitionRepository;
        this.seasonRepository = seasonRepository;
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
        competition.setSeason(getSeasonById(competitionRequestDTO.getSeasonId()));
    }

    private CompetitionDTO toDto(Competition competition) {
        return new CompetitionDTO(
                competition.getId(),
                competition.getName(),
                competition.getSeason().getId(),
                competition.getSeason().getName()
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
