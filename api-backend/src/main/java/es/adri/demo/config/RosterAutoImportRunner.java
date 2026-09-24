package es.adri.demo.config;

import es.adri.demo.dto.ScrapedPlayerDTO;
import es.adri.demo.model.Season;
import es.adri.demo.repository.SeasonRepository;
import es.adri.demo.service.RosterScrapeService;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class RosterAutoImportRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(RosterAutoImportRunner.class);
    private final SeasonRepository seasonRepository;
    private final RosterScrapeService rosterScrapeService;

    public RosterAutoImportRunner(SeasonRepository seasonRepository, RosterScrapeService rosterScrapeService) {
        this.seasonRepository = seasonRepository;
        this.rosterScrapeService = rosterScrapeService;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            Optional<Season> currentOpt = seasonRepository.findByCurrentTrue();
            if (currentOpt.isEmpty()) {
                log.info("Roster auto-import: no hay temporada current");
                return;
            }
            Season current = currentOpt.get();
            log.info("Roster auto-import: scrape temporada {} (id={})", current.getName(), current.getId());
            List<ScrapedPlayerDTO> scraped = rosterScrapeService.scrapeSeason(current.getId());
            log.info("Roster auto-import: {} jugadores detectados en actas", scraped.size());
            if (scraped.isEmpty()) return;
            List<ScrapedPlayerDTO> imported = rosterScrapeService.importScraped(current.getId(), scraped);
            log.info("Roster auto-import: {} jugadores importados/actualizados", imported.size());
            // log si Alejandro está
            scraped.stream().filter(p -> p.getFullName() != null && p.getFullName().toUpperCase().contains("LOPEZ MALDONADO")).forEach(p ->
                    log.info("Roster auto-import: encontrado {}", p.getFullName()));
        } catch (Exception e) {
            log.warn("Roster auto-import falló (continuando sin bloquear arranque): {}", e.toString());
        }
    }
}
