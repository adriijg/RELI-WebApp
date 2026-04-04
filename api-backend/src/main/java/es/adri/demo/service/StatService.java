package es.adri.demo.service;

import es.adri.demo.dto.PagedResponseDTO;
import es.adri.demo.dto.StatDTO;
import es.adri.demo.dto.StatRequestDTO;
import es.adri.demo.exception.ResourceNotFoundException;
import es.adri.demo.model.Match;
import es.adri.demo.model.Player;
import es.adri.demo.model.Stat;
import es.adri.demo.repository.MatchRepository;
import es.adri.demo.repository.PlayerRepository;
import es.adri.demo.repository.StatRepository;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class StatService {

    private final StatRepository statRepository;
    private final PlayerRepository playerRepository;
    private final MatchRepository matchRepository;

    public StatService(StatRepository statRepository, PlayerRepository playerRepository, MatchRepository matchRepository) {
        this.statRepository = statRepository;
        this.playerRepository = playerRepository;
        this.matchRepository = matchRepository;
    }

    public PagedResponseDTO<StatDTO> findAllStats(Pageable pageable) {
        Page<StatDTO> page = statRepository.findAll(pageable)
                .map(this::toDto);
        return toPagedResponse(page);
    }

    public StatDTO findStatById(Long id) {
        return toDto(getStatById(id));
    }

    public PagedResponseDTO<StatDTO> findStatsByPlayerId(Long playerId, Pageable pageable) {
        Page<StatDTO> page = statRepository.findByPlayerId(playerId, pageable)
                .map(this::toDto);
        return toPagedResponse(page);
    }

    public PagedResponseDTO<StatDTO> findStatsByMatchId(Long matchId, Pageable pageable) {
        Page<StatDTO> page = statRepository.findByMatchId(matchId, pageable)
                .map(this::toDto);
        return toPagedResponse(page);
    }

    @Transactional
    public StatDTO createStat(StatRequestDTO statRequestDTO) {
        Stat stat = new Stat();
        mapRequestToEntity(statRequestDTO, stat);
        return toDto(statRepository.save(stat));
    }

    @Transactional
    public StatDTO updateStat(Long id, StatRequestDTO statRequestDTO) {
        Stat stat = getStatById(id);
        mapRequestToEntity(statRequestDTO, stat);
        return toDto(statRepository.save(stat));
    }

    @Transactional
    public void deleteStat(Long id) {
        statRepository.delete(getStatById(id));
    }

    private Stat getStatById(Long id) {
        return statRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Estadistica no encontrada"));
    }

    private Player getPlayerById(Long playerId) {
        return playerRepository.findById(playerId)
                .orElseThrow(() -> new ResourceNotFoundException("Jugador no encontrado"));
    }

    private Match getMatchById(Long matchId) {
        return matchRepository.findById(matchId)
                .orElseThrow(() -> new ResourceNotFoundException("Partido no encontrado"));
    }

    private void mapRequestToEntity(StatRequestDTO statRequestDTO, Stat stat) {
        stat.setPlayer(getPlayerById(statRequestDTO.getPlayerId()));
        stat.setMatch(getMatchById(statRequestDTO.getMatchId()));
        stat.setGoals(statRequestDTO.getGoals());
        stat.setAssists(statRequestDTO.getAssists());
        stat.setYellowCards(statRequestDTO.getYellowCards());
        stat.setRedCards(statRequestDTO.getRedCards());
        stat.setMvp(statRequestDTO.isMvp());
        stat.setAttended(statRequestDTO.isAttended());
    }

    private StatDTO toDto(Stat stat) {
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

    private PagedResponseDTO<StatDTO> toPagedResponse(Page<StatDTO> page) {
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
