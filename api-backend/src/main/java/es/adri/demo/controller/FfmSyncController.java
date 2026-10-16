package es.adri.demo.controller;

import es.adri.demo.dto.FfmSyncResultDTO;
import es.adri.demo.model.FfmSyncRun;
import es.adri.demo.service.FfmSyncService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/sync")
@PreAuthorize("hasRole('ADMIN')")
public class FfmSyncController {

    private final FfmSyncService ffmSyncService;

    public FfmSyncController(FfmSyncService ffmSyncService) {
        this.ffmSyncService = ffmSyncService;
    }

    @GetMapping("/ffm/runs")
    public ResponseEntity<List<FfmSyncRun>> lastRuns() {
        return ResponseEntity.ok(ffmSyncService.lastRuns());
    }

    @PostMapping("/ffm/preview")
    public ResponseEntity<FfmSyncResultDTO> preview(@RequestParam Long competitionId) {
        return ResponseEntity.ok(ffmSyncService.preview(competitionId));
    }

    @PostMapping("/ffm/apply")
    public ResponseEntity<FfmSyncResultDTO> apply(@RequestParam Long competitionId) {
        return ResponseEntity.ok(ffmSyncService.apply(competitionId));
    }

    /** Sincroniza los resultados de una jornada (nuestro partido + los demas). */
    @PostMapping("/ffm/results/jornada")
    public ResponseEntity<FfmSyncService.FfmJornadaResultDTO> syncJornada(
            @RequestParam Long competitionId, @RequestParam Integer jornada) {
        return ResponseEntity.ok(ffmSyncService.syncJornadaResults(competitionId, jornada));
    }

    /** Sincroniza el resultado de un partido concreto (por su jornada). */
    @PostMapping("/ffm/results/match/{matchId}")
    public ResponseEntity<FfmSyncService.FfmJornadaResultDTO> syncMatch(@PathVariable Long matchId) {
        return ResponseEntity.ok(ffmSyncService.syncMatchResult(matchId));
    }
}
