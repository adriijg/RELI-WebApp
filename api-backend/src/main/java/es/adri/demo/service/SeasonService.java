package es.adri.demo.service;

import es.adri.demo.dto.PagedResponseDTO;
import es.adri.demo.dto.SeasonDTO;
import es.adri.demo.dto.SeasonRequestDTO;
import es.adri.demo.exception.ResourceNotFoundException;
import es.adri.demo.model.Season;
import es.adri.demo.repository.SeasonRepository;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class SeasonService {

    private final SeasonRepository seasonRepository;

    public SeasonService(SeasonRepository seasonRepository) {
        this.seasonRepository = seasonRepository;
    }

    public PagedResponseDTO<SeasonDTO> findAllSeasons(Pageable pageable) {
        Page<SeasonDTO> page = seasonRepository.findAll(pageable)
                .map(this::toDto);
        return toPagedResponse(page);
    }

    public SeasonDTO findSeasonById(Long id) {
        return toDto(getSeasonById(id));
    }

    public SeasonDTO createSeason(SeasonRequestDTO seasonRequestDTO) {
        Season season = new Season();
        mapRequestToEntity(seasonRequestDTO, season);
        return toDto(seasonRepository.save(season));
    }

    public SeasonDTO updateSeason(Long id, SeasonRequestDTO seasonRequestDTO) {
        Season season = getSeasonById(id);
        mapRequestToEntity(seasonRequestDTO, season);
        return toDto(seasonRepository.save(season));
    }

    public void deleteSeason(Long id) {
        seasonRepository.delete(getSeasonById(id));
    }

    private Season getSeasonById(Long id) {
        return seasonRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Temporada no encontrada"));
    }

    private void mapRequestToEntity(SeasonRequestDTO seasonRequestDTO, Season season) {
        season.setName(seasonRequestDTO.getName());
        season.setCurrent(seasonRequestDTO.isCurrent());
    }

    private SeasonDTO toDto(Season season) {
        return new SeasonDTO(season.getId(), season.getName(), season.isCurrent());
    }

    private PagedResponseDTO<SeasonDTO> toPagedResponse(Page<SeasonDTO> page) {
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
