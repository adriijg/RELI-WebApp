package es.adri.demo.repository;

import es.adri.demo.model.PlayerSeason;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlayerSeasonRepository extends JpaRepository<PlayerSeason, Long> {

    List<PlayerSeason> findBySeasonId(Long seasonId);

    List<PlayerSeason> findByPlayerId(Long playerId);

    Optional<PlayerSeason> findByPlayerIdAndSeasonId(Long playerId, Long seasonId);

    boolean existsByPlayerIdAndSeasonId(Long playerId, Long seasonId);

    void deleteByPlayerIdAndSeasonId(Long playerId, Long seasonId);
}
