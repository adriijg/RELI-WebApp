package es.adri.demo.service;

import es.adri.demo.dto.PlayerSeasonDTO;
import es.adri.demo.dto.PlayerSeasonRequestDTO;
import es.adri.demo.exception.ResourceNotFoundException;
import es.adri.demo.model.Player;
import es.adri.demo.model.PlayerSeason;
import es.adri.demo.model.Season;
import es.adri.demo.repository.PlayerRepository;
import es.adri.demo.repository.PlayerSeasonRepository;
import es.adri.demo.repository.SeasonRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.CONFLICT;

@Service
@Transactional
public class PlayerSeasonService {

    private final PlayerSeasonRepository playerSeasonRepository;
    private final PlayerRepository playerRepository;
    private final SeasonRepository seasonRepository;

    public PlayerSeasonService(PlayerSeasonRepository playerSeasonRepository,
                               PlayerRepository playerRepository,
                               SeasonRepository seasonRepository) {
        this.playerSeasonRepository = playerSeasonRepository;
        this.playerRepository = playerRepository;
        this.seasonRepository = seasonRepository;
    }

    public List<PlayerSeasonDTO> findBySeason(Long seasonId) {
        try {
            return playerSeasonRepository.findBySeasonId(seasonId).stream()
                    .map(this::toDto)
                    .toList();
        } catch (Exception ex) {
            // tabla aún no existe (ddl auto) → devolver vacío sin 500
            return List.of();
        }
    }

    public List<PlayerSeasonDTO> findByPlayer(Long playerId) {
        try {
            return playerSeasonRepository.findByPlayerId(playerId).stream()
                    .map(this::toDto)
                    .toList();
        } catch (Exception ex) {
            return List.of();
        }
    }

    public PlayerSeasonDTO assign(PlayerSeasonRequestDTO req) {
        var existing = playerSeasonRepository.findByPlayerIdAndSeasonId(req.getPlayerId(), req.getSeasonId());
        if (existing.isPresent()) {
            PlayerSeason ps = existing.get();
            ps.setJerseyNumber(req.getJerseyNumber());
            return toDto(playerSeasonRepository.save(ps));
        }
        Player player = playerRepository.findById(req.getPlayerId())
                .orElseThrow(() -> new ResourceNotFoundException("Jugador no encontrado"));
        Season season = seasonRepository.findById(req.getSeasonId())
                .orElseThrow(() -> new ResourceNotFoundException("Temporada no encontrada"));
        PlayerSeason ps = new PlayerSeason();
        ps.setPlayer(player);
        ps.setSeason(season);
        ps.setJerseyNumber(req.getJerseyNumber());
        return toDto(playerSeasonRepository.save(ps));
    }

    public void unassign(Long seasonId, Long playerId) {
        PlayerSeason ps = playerSeasonRepository.findByPlayerIdAndSeasonId(playerId, seasonId)
                .orElseThrow(() -> new ResourceNotFoundException("Asignación no encontrada"));
        playerSeasonRepository.delete(ps);
    }

    private PlayerSeasonDTO toDto(PlayerSeason ps) {
        Player p = ps.getPlayer();
        Season s = ps.getSeason();
        return new PlayerSeasonDTO(
                ps.getId(),
                p.getId(),
                s.getId(),
                s.getName(),
                ps.getJerseyNumber(),
                p.getName(),
                p.getNickname(),
                p.getSurnames(),
                p.getPosition(),
                p.getPhotoUrl(),
                p.isActive()
        );
    }
}
