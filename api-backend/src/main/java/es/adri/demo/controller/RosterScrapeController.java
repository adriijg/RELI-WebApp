package es.adri.demo.controller;

import es.adri.demo.dto.StatsScrapeResultDTO;
import es.adri.demo.service.RosterScrapeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/scrape")
public class RosterScrapeController {

    private final RosterScrapeService rosterScrapeService;

    public RosterScrapeController(RosterScrapeService rosterScrapeService) {
        this.rosterScrapeService = rosterScrapeService;
    }

    /** Importa el acta (convocados, goles y tarjetas) de UN partido concreto. */
    @PostMapping("/match/{matchId}/acta")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StatsScrapeResultDTO> scrapeMatchActa(@PathVariable Long matchId) {
        return ResponseEntity.ok(rosterScrapeService.importMatchActa(matchId));
    }
}
