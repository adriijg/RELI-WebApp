package es.adri.demo.controller;

import es.adri.demo.dto.QuintetBallotDTO;
import es.adri.demo.dto.QuintetSeasonTallyDTO;
import es.adri.demo.dto.QuintetTallyDTO;
import es.adri.demo.dto.QuintetVoteRequestDTO;
import es.adri.demo.service.QuintetVoteService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/quintet")
public class QuintetVoteController {

    private final QuintetVoteService quintetVoteService;

    public QuintetVoteController(QuintetVoteService quintetVoteService) {
        this.quintetVoteService = quintetVoteService;
    }

    @PostMapping("/votes")
    public ResponseEntity<QuintetBallotDTO> vote(@Valid @RequestBody QuintetVoteRequestDTO request) {
        return ResponseEntity.ok(quintetVoteService.save(request));
    }

    @GetMapping("/me")
    public ResponseEntity<QuintetBallotDTO> mine(
            @RequestParam Long seasonId,
            @RequestParam Integer jornada
    ) {
        QuintetBallotDTO ballot = quintetVoteService.mine(seasonId, jornada);
        if (ballot == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(ballot);
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteMine(
            @RequestParam Long seasonId,
            @RequestParam Integer jornada
    ) {
        quintetVoteService.deleteMine(seasonId, jornada);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/tally")
    public ResponseEntity<QuintetTallyDTO> tally(
            @RequestParam Long seasonId,
            @RequestParam Integer jornada
    ) {
        return ResponseEntity.ok(quintetVoteService.tally(seasonId, jornada));
    }

    @GetMapping("/ballots")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<QuintetBallotDTO>> ballots(
            @RequestParam Long seasonId,
            @RequestParam Integer jornada
    ) {
        return ResponseEntity.ok(quintetVoteService.ballots(seasonId, jornada));
    }

    @GetMapping("/season-tally")
    public ResponseEntity<QuintetSeasonTallyDTO> seasonTally(
            @RequestParam Long seasonId
    ) {
        return ResponseEntity.ok(quintetVoteService.seasonTally(seasonId));
    }

    @GetMapping("/status")
    public ResponseEntity<?> status(
            @RequestParam Long seasonId,
            @RequestParam Integer jornada
    ) {
        return ResponseEntity.ok(quintetVoteService.status(seasonId, jornada));
    }

    @PostMapping("/open")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> open(
            @RequestParam Long seasonId,
            @RequestParam Integer jornada
    ) {
        return ResponseEntity.ok(quintetVoteService.open(seasonId, jornada));
    }

    @PostMapping("/close")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> close(
            @RequestParam Long seasonId,
            @RequestParam Integer jornada
    ) {
        return ResponseEntity.ok(quintetVoteService.close(seasonId, jornada));
    }
}
