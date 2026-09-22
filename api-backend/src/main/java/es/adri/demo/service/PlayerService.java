package es.adri.demo.service;

import es.adri.demo.dto.PagedResponseDTO;
import es.adri.demo.dto.PlayerDTO;
import es.adri.demo.dto.PlayerRequestDTO;
import es.adri.demo.dto.PlayerSeasonStatsDTO;
import es.adri.demo.exception.ResourceNotFoundException;
import es.adri.demo.model.Player;
import es.adri.demo.repository.MatchCallUpRepository;
import es.adri.demo.repository.MatchGoalRepository;
import es.adri.demo.repository.PlayerRepository;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class PlayerService {

    private final PlayerRepository playerRepository;
    private final MatchGoalRepository matchGoalRepository;
    private final MatchCallUpRepository matchCallUpRepository;

    public PlayerService(PlayerRepository playerRepository,
                         MatchGoalRepository matchGoalRepository,
                         MatchCallUpRepository matchCallUpRepository) {
        this.playerRepository = playerRepository;
        this.matchGoalRepository = matchGoalRepository;
        this.matchCallUpRepository = matchCallUpRepository;
    }

    public PagedResponseDTO<PlayerDTO> findAllActivePlayers(Pageable pageable) {
        Page<PlayerDTO> page = playerRepository.findAllByActiveTrue(pageable)
                .map(this::toDto);
        return toPagedResponse(page);
    }

    public List<PlayerDTO> findAllActive() {
        return playerRepository.findAllByActiveTrue().stream()
                .map(this::toDto)
                .toList();
    }

    public List<PlayerSeasonStatsDTO> findSeasonStats(Long seasonId) {
        Map<Long, Long> goalsMap = new HashMap<>();
        List<Object[]> goalRows = seasonId == null
                ? matchGoalRepository.countGoalsByCurrentSeason()
                : matchGoalRepository.countGoalsBySeason(seasonId);
        for (Object[] row : goalRows) {
            goalsMap.put((Long) row[0], (Long) row[1]);
        }

        Map<Long, Long> appearancesMap = new HashMap<>();
        List<Object[]> appearanceRows = seasonId == null
                ? matchCallUpRepository.countAppearancesByCurrentSeason()
                : matchCallUpRepository.countAppearancesBySeason(seasonId);
        for (Object[] row : appearanceRows) {
            appearancesMap.put((Long) row[0], (Long) row[1]);
        }

        Map<Long, Long> cleanSheetsMap = new HashMap<>();
        List<Object[]> cleanSheetRows = seasonId == null
                ? matchCallUpRepository.countCleanSheetsByCurrentSeason()
                : matchCallUpRepository.countCleanSheetsBySeason(seasonId);
        for (Object[] row : cleanSheetRows) {
            cleanSheetsMap.put((Long) row[0], (Long) row[1]);
        }

        List<PlayerSeasonStatsDTO> result = new ArrayList<>();
        for (Player player : playerRepository.findAllByActiveTrue()) {
            Long id = player.getId();
            result.add(new PlayerSeasonStatsDTO(
                    id,
                    player.getName(),
                    player.getNickname(),
                    player.getJerseyNumber(),
                    player.getPosition(),
                    player.getPhotoUrl(),
                    goalsMap.getOrDefault(id, 0L),
                    0L,
                    0L,
                    0L,
                    appearancesMap.getOrDefault(id, 0L),
                    cleanSheetsMap.getOrDefault(id, 0L)
            ));
        }
        return result;
    }

    public PlayerDTO createPlayer(PlayerRequestDTO playerRequestDTO) {
        Player player = new Player();
        mapRequestToEntity(playerRequestDTO, player);
        player.setActive(true);
        return toDto(playerRepository.save(player));
    }

    public PlayerDTO updatePlayer(Long id, PlayerRequestDTO playerRequestDTO) {
        Player player = getPlayerById(id);
        mapRequestToEntity(playerRequestDTO, player);
        return toDto(playerRepository.save(player));
    }

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
        player.setJerseyNumber(playerRequestDTO.getJerseyNumber());
        player.setPosition(playerRequestDTO.getPosition());
        player.setPhotoUrl(playerRequestDTO.getPhotoUrl());
    }

    private PlayerDTO toDto(Player player) {
        return new PlayerDTO(
                player.getId(),
                player.getName(),
                player.getNickname(),
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
