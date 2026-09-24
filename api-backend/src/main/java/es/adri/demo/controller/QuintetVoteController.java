package es.adri.demo.controller;

import es.adri.demo.dto.QuintetBallotDTO;
import es.adri.demo.dto.QuintetTallyDTO;
import es.adri.demo.dto.QuintetVoteRequestDTO;
import es.adri.demo.service.QuintetVoteService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
}
