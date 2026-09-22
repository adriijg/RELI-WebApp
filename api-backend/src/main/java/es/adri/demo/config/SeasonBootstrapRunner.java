package es.adri.demo.config;

import es.adri.demo.model.Season;
import es.adri.demo.repository.SeasonRepository;
import java.util.List;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class SeasonBootstrapRunner implements ApplicationRunner {

    private static final List<String> SEASON_NAMES = List.of(
            "2025/26",
            "2026/27"
    );

    private final SeasonRepository seasonRepository;

    public SeasonBootstrapRunner(SeasonRepository seasonRepository) {
        this.seasonRepository = seasonRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        for (String name : SEASON_NAMES) {
            if (seasonRepository.existsByName(name)) {
                continue;
            }
            Season season = new Season();
            season.setName(name);
            season.setCurrent("2026/27".equals(name));
            seasonRepository.save(season);
        }
    }
}
