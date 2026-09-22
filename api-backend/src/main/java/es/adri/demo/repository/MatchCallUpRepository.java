package es.adri.demo.repository;

import es.adri.demo.model.MatchCallUp;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MatchCallUpRepository extends JpaRepository<MatchCallUp, Long> {

    List<MatchCallUp> findByMatchIdOrderByIdAsc(Long matchId);

    Optional<MatchCallUp> findByMatchIdAndPlayerId(Long matchId, Long playerId);

    boolean existsByMatchIdAndPlayerId(Long matchId, Long playerId);

    void deleteByMatchId(Long matchId);

    @Query("""
            SELECT c.player.id, COUNT(c.id)
            FROM MatchCallUp c
            WHERE c.match.competition.season.current = true
            GROUP BY c.player.id
            """)
    List<Object[]> countAppearancesByCurrentSeason();

    @Query("""
            SELECT c.player.id, COUNT(c.id)
            FROM MatchCallUp c
            WHERE c.match.competition.season.id = :seasonId
            GROUP BY c.player.id
            """)
    List<Object[]> countAppearancesBySeason(@Param("seasonId") Long seasonId);

    @Query("""
            SELECT c.player.id, COUNT(c.id)
            FROM MatchCallUp c
            WHERE c.match.competition.season.current = true
              AND c.player.position = es.adri.demo.model.Position.PORTERO
              AND c.match.rivalGoals = 0
            GROUP BY c.player.id
            """)
    List<Object[]> countCleanSheetsByCurrentSeason();

                @Query("""
                                                SELECT c.player.id, COUNT(c.id)
                                                FROM MatchCallUp c
                                                WHERE c.match.competition.season.id = :seasonId
                                                        AND c.player.position = es.adri.demo.model.Position.PORTERO
                                                        AND c.match.rivalGoals = 0
                                                GROUP BY c.player.id
                                                """)
                List<Object[]> countCleanSheetsBySeason(@Param("seasonId") Long seasonId);
}
