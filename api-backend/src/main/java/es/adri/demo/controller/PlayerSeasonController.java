package es.adri.demo.controller;

import es.adri.demo.dto.PlayerSeasonDTO;
import es.adri.demo.dto.PlayerSeasonRequestDTO;
import es.adri.demo.service.PlayerSeasonService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/player-seasons")
public class PlayerSeasonController {

    private final PlayerSeasonService playerSeasonService;

    public PlayerSeasonController(PlayerSeasonService playerSeasonService) {
        this.playerSeasonService = playerSeasonService;
    }

    @GetMapping
    public ResponseEntity<List<PlayerSeasonDTO>> list(
            @RequestParam(required = false) Long seasonId,
            @RequestParam(required = false) Long playerId) {
        if (seasonId != null) {
            return ResponseEntity.ok(playerSeasonService.findBySeason(seasonId));
        }
        if (playerId != null) {
            return ResponseEntity.ok(playerSeasonService.findByPlayer(playerId));
        }
        return ResponseEntity.badRequest().build();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PlayerSeasonDTO> assign(@Valid @RequestBody PlayerSeasonRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(playerSeasonService.assign(request));
    }

    @DeleteMapping("/{seasonId}/{playerId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> unassign(@PathVariable Long seasonId, @PathVariable Long playerId) {
        playerSeasonService.unassign(seasonId, playerId);
        return ResponseEntity.noContent().build();
    }
}
