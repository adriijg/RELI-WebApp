package es.adri.demo.service;

import es.adri.demo.dto.PagedResponseDTO;
import es.adri.demo.dto.PlayerDTO;
import es.adri.demo.dto.PlayerMatchStatDTO;
import es.adri.demo.dto.PlayerRequestDTO;
import es.adri.demo.dto.PlayerSeasonStatsDTO;
import es.adri.demo.exception.ResourceNotFoundException;
import es.adri.demo.model.Player;
import es.adri.demo.model.PlayerSeason;
import es.adri.demo.repository.PlayerRepository;
import es.adri.demo.repository.PlayerSeasonRepository;
import es.adri.demo.repository.StatRepository;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class PlayerService {

    private final PlayerRepository playerRepository;
    private final StatRepository statRepository;
    private final PlayerSeasonRepository playerSeasonRepository;

    public PlayerService(PlayerRepository playerRepository,
                         StatRepository statRepository,
                         PlayerSeasonRepository playerSeasonRepository) {
        this.playerRepository = playerRepository;
        this.statRepository = statRepository;
        this.playerSeasonRepository = playerSeasonRepository;
    }

    public PagedResponseDTO<PlayerDTO> findAllActivePlayers(Pageable pageable) {
        Page<PlayerDTO> page = playerRepository.findAllByActiveTrue(pageable)
                .map(this::toDto);
        return toPagedResponse(page);
    }

    public PagedResponseDTO<PlayerDTO> findActivePlayersBySearch(String search, Pageable pageable) {
        Page<PlayerDTO> page = playerRepository.findActiveBySearch(search, pageable)
                .map(this::toDto);
        return toPagedResponse(page);
    }

    public List<PlayerDTO> findAllActive() {
        return playerRepository.findAllByActiveTrue().stream()
                .map(this::toDto)
                .toList();
    }

    @Cacheable(value = "playerSeasonStats", key = "#seasonId == null ? 'current' : #seasonId")
    public List<PlayerSeasonStatsDTO> findSeasonStats(Long seasonId) {
        // Usar Stat como fuente única para que los cambios desde /admin/estadísticas se reflejen en Jugadores
        Map<Long, Long> goalsMap = new HashMap<>();
        List<Object[]> goalRows = seasonId == null
                ? statRepository.sumGoalsByCurrentSeason()
                : statRepository.sumGoalsBySeason(seasonId);
        for (Object[] row : goalRows) {
            goalsMap.put((Long) row[0], ((Number) row[1]).longValue());
        }

        Map<Long, Long> appearancesMap = new HashMap<>();
        List<Object[]> appearanceRows = seasonId == null
                ? statRepository.countAppearancesByCurrentSeasonFromStat()
                : statRepository.countAppearancesBySeasonFromStat(seasonId);
        for (Object[] row : appearanceRows) {
            appearancesMap.put((Long) row[0], ((Number) row[1]).longValue());
        }

        Map<Long, Long> cleanSheetsMap = new HashMap<>();
        List<Object[]> cleanSheetRows = seasonId == null
                ? statRepository.countCleanSheetsByCurrentSeason()
                : statRepository.countCleanSheetsBySeason(seasonId);
        for (Object[] row : cleanSheetRows) {
            cleanSheetsMap.put((Long) row[0], ((Number) row[1]).longValue());
        }

        Map<Long, long[]> cardsMap = new HashMap<>();
        List<Object[]> cardRows = seasonId == null
                ? statRepository.sumCardsByCurrentSeason()
                : statRepository.sumCardsBySeason(seasonId);
        for (Object[] row : cardRows) {
            cardsMap.put((Long) row[0],
                    new long[]{((Number) row[1]).longValue(),
                            ((Number) row[2]).longValue(),
                            ((Number) row[3]).longValue()});
        }

        // Si hay roster para la temporada, filtrar solo esos jugadores y usar dorsal del roster
        List<Player> basePlayers;
        Map<Long, Integer> rosterJersey = new HashMap<>();
        if (seasonId != null) {
            List<PlayerSeason> roster;
            try {
                roster = playerSeasonRepository.findBySeasonId(seasonId);
            } catch (Exception ex) {
                roster = List.of();
            }
            if (!roster.isEmpty()) {
                basePlayers = roster.stream()
                        .filter(ps -> ps.getPlayer() != null && ps.getPlayer().isActive())
                        .map(PlayerSeason::getPlayer)
                        .toList();
                for (PlayerSeason ps : roster) {
                    if (ps.getPlayer() != null) rosterJersey.put(ps.getPlayer().getId(), ps.getJerseyNumber());
                }
            } else {
                // temporada sin roster: devolver vacio para forzar asignacion (el bootstrap la poblará)
                basePlayers = List.of();
            }
        } else {
            basePlayers = playerRepository.findAllByActiveTrue();
        }

        List<PlayerSeasonStatsDTO> result = new ArrayList<>();
        for (Player player : basePlayers) {
            Long id = player.getId();
            long[] cards = cardsMap.getOrDefault(id, new long[3]);
            Integer jersey = rosterJersey.getOrDefault(id, player.getJerseyNumber());
            result.add(new PlayerSeasonStatsDTO(
                    id,
                    player.getName(),
                    player.getNickname(),
                    player.getSurnames(),
                    jersey,
                    player.getPosition(),
                    player.getPhotoUrl(),
                    goalsMap.getOrDefault(id, 0L),
                    cards[0],
                    cards[1],
                    cards[2],
                    appearancesMap.getOrDefault(id, 0L),
                    cleanSheetsMap.getOrDefault(id, 0L)
            ));
        }
        return result;
    }

    public List<PlayerMatchStatDTO> findPlayerMatchStats(Long playerId, Long seasonId) {
        return statRepository.findPlayerMatchStats(playerId, seasonId).stream()
                .map(stat -> new PlayerMatchStatDTO(
                        stat.getId(),
                        stat.getMatch().getId(),
                        stat.getMatch().getRival(),
                        stat.getMatch().isHome(),
                        stat.getMatch().getDate(),
                        stat.getMatch().getJornada(),
                        stat.getGoals(),
                        stat.getYellowCards(),
                        stat.getRedCards(),
                        stat.isMvp()
                ))
                .toList();
    }

    @CacheEvict(value = "playerSeasonStats", allEntries = true)
    public PlayerDTO createPlayer(PlayerRequestDTO playerRequestDTO) {
        Player player = new Player();
        mapRequestToEntity(playerRequestDTO, player);
        player.setActive(true);
        return toDto(playerRepository.save(player));
    }

    @CacheEvict(value = "playerSeasonStats", allEntries = true)
    public PlayerDTO updatePlayer(Long id, PlayerRequestDTO playerRequestDTO) {
        Player player = getPlayerById(id);
        mapRequestToEntity(playerRequestDTO, player);
        return toDto(playerRepository.save(player));
    }

    @CacheEvict(value = "playerSeasonStats", allEntries = true)
    public void softDeletePlayer(Long id) {
        Player player = getPlayerById(id);
        player.setActive(false);
        playerRepository.save(player);
    }

    private Player getPlayerById(Long id) {
        return playerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Jugador no encontrado"));
    }

    private void mapRequestToEntity(PlayerRequestDTO playerRequestDTO, Player player) {
        player.setName(playerRequestDTO.getName());
        player.setNickname(playerRequestDTO.getNickname());
        player.setSurnames(playerRequestDTO.getSurnames());
        player.setJerseyNumber(playerRequestDTO.getJerseyNumber());
        player.setPosition(playerRequestDTO.getPosition());
        player.setPhotoUrl(playerRequestDTO.getPhotoUrl());
    }

    private PlayerDTO toDto(Player player) {
        return new PlayerDTO(
                player.getId(),
                player.getName(),
                player.getNickname(),
                player.getSurnames(),
                player.getJerseyNumber(),
                player.getPosition(),
                player.getPhotoUrl(),
                player.isActive()
        );
    }

    private PagedResponseDTO<PlayerDTO> toPagedResponse(Page<PlayerDTO> page) {
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
