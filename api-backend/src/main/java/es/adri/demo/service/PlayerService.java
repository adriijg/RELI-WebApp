package es.adri.demo.service;

import es.adri.demo.dto.PagedResponseDTO;
import es.adri.demo.dto.PlayerDTO;
import es.adri.demo.dto.PlayerRequestDTO;
import es.adri.demo.exception.ResourceNotFoundException;
import es.adri.demo.model.Player;
import es.adri.demo.repository.PlayerRepository;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class PlayerService {

    private final PlayerRepository playerRepository;

    public PlayerService(PlayerRepository playerRepository) {
        this.playerRepository = playerRepository;
    }

    public PagedResponseDTO<PlayerDTO> findAllActivePlayers(Pageable pageable) {
        Page<PlayerDTO> page = playerRepository.findAllByActiveTrue(pageable)
                .map(this::toDto);
        return toPagedResponse(page);
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
