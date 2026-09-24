package es.adri.demo.controller;

import es.adri.demo.dto.ScrapedPlayerDTO;
import es.adri.demo.service.RosterScrapeService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/scrape")
public class RosterScrapeController {

    private final RosterScrapeService rosterScrapeService;
    public RosterScrapeController(RosterScrapeService rosterScrapeService) { this.rosterScrapeService = rosterScrapeService; }

    @GetMapping("/roster")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ScrapedPlayerDTO>> scrape(@RequestParam Long seasonId) {
        return ResponseEntity.ok(rosterScrapeService.scrapeSeason(seasonId));
    }

    @PostMapping("/roster/import")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ScrapedPlayerDTO>> importRoster(@RequestParam Long seasonId, @RequestBody List<ScrapedPlayerDTO> players) {
        return ResponseEntity.ok(rosterScrapeService.importScraped(seasonId, players));
    }

    @PostMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<es.adri.demo.dto.StatsScrapeResultDTO> scrapeStats(@RequestParam Long seasonId) {
        return ResponseEntity.ok(rosterScrapeService.scrapeStats(seasonId));
    }

    @PostMapping("/match/{matchId}/acta")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<es.adri.demo.dto.StatsScrapeResultDTO> scrapeMatchActa(@PathVariable Long matchId) {
        return ResponseEntity.ok(rosterScrapeService.scrapeSingleMatchActa(matchId));
    }
}
