package es.adri.demo.controller;

import es.adri.demo.dto.StatDTO;
import es.adri.demo.dto.StatRequestDTO;
import es.adri.demo.service.StatService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stats")
public class StatController {

    private final StatService statService;

    public StatController(StatService statService) {
        this.statService = statService;
    }

    @GetMapping
    public ResponseEntity<List<StatDTO>> getStats(
            @RequestParam(required = false) Long playerId,
            @RequestParam(required = false) Long matchId
    ) {
        if (playerId != null) {
            return ResponseEntity.ok(statService.findStatsByPlayerId(playerId));
        }
        if (matchId != null) {
            return ResponseEntity.ok(statService.findStatsByMatchId(matchId));
        }
        return ResponseEntity.ok(statService.findAllStats());
    }

    @GetMapping("/{id}")
    public ResponseEntity<StatDTO> getStatById(@PathVariable Long id) {
        return ResponseEntity.ok(statService.findStatById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StatDTO> createStat(@Valid @RequestBody StatRequestDTO statRequestDTO) {
        return ResponseEntity.status(HttpStatus.CREATED).body(statService.createStat(statRequestDTO));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StatDTO> updateStat(@PathVariable Long id, @Valid @RequestBody StatRequestDTO statRequestDTO) {
        return ResponseEntity.ok(statService.updateStat(id, statRequestDTO));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteStat(@PathVariable Long id) {
        statService.deleteStat(id);
        return ResponseEntity.noContent().build();
    }
}
