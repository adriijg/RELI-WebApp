package es.adri.demo.config;

import es.adri.demo.model.Player;
import es.adri.demo.model.PlayerSeason;
import es.adri.demo.model.Season;
import es.adri.demo.repository.PlayerRepository;
import es.adri.demo.repository.PlayerSeasonRepository;
import es.adri.demo.repository.SeasonRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class PlayerSeasonBootstrapRunner implements ApplicationRunner {

    private final SeasonRepository seasonRepository;
    private final PlayerRepository playerRepository;
    private final PlayerSeasonRepository playerSeasonRepository;

    public PlayerSeasonBootstrapRunner(SeasonRepository seasonRepository,
                                       PlayerRepository playerRepository,
                                       PlayerSeasonRepository playerSeasonRepository) {
        this.seasonRepository = seasonRepository;
        this.playerRepository = playerRepository;
        this.playerSeasonRepository = playerSeasonRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            Optional<Season> currentOpt = seasonRepository.findByCurrentTrue();
            if (currentOpt.isEmpty()) return;
            Season current = currentOpt.get();
            List<PlayerSeason> existing;
            try {
                existing = playerSeasonRepository.findBySeasonId(current.getId());
            } catch (Exception ex) {
                // tabla aún no creada (ddl update) → no intentar poblar
                return;
            }
            if (!existing.isEmpty()) return;
            List<Player> actives = playerRepository.findAllByActiveTrue();
            for (Player p : actives) {
                PlayerSeason ps = new PlayerSeason();
                ps.setPlayer(p);
                ps.setSeason(current);
                ps.setJerseyNumber(p.getJerseyNumber());
                try {
                    playerSeasonRepository.save(ps);
                } catch (Exception ex) {
                    // ignorar error de tabla inexistente en primer arranque
                    return;
                }
            }
        } catch (Exception ignored) {
        }
    }
}
