package es.adri.demo.repository;

import es.adri.demo.model.Stat;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StatRepository extends JpaRepository<Stat, Long> {

    List<Stat> findByPlayerId(Long playerId);

    List<Stat> findByMatchId(Long matchId);

    Optional<Stat> findByPlayerIdAndMatchId(Long playerId, Long matchId);

    Page<Stat> findByPlayerId(Long playerId, Pageable pageable);

    Page<Stat> findByMatchId(Long matchId, Pageable pageable);

    @Query("""
            SELECT s.player.id, COALESCE(SUM(s.goals), 0)
            FROM Stat s
            WHERE s.match.competition.season.current = true
              AND s.match.status = es.adri.demo.model.MatchStatus.FINISHED
            GROUP BY s.player.id
            """)
    List<Object[]> sumGoalsByCurrentSeason();

    @Query("""
            SELECT s.player.id, COALESCE(SUM(s.goals), 0)
            FROM Stat s
            WHERE s.match.competition.season.id = :seasonId
              AND s.match.status = es.adri.demo.model.MatchStatus.FINISHED
            GROUP BY s.player.id
            """)
    List<Object[]> sumGoalsBySeason(@Param("seasonId") Long seasonId);

    @Query("""
            SELECT s.player.id, COALESCE(SUM(s.assists), 0),
                   COALESCE(SUM(s.yellowCards), 0), COALESCE(SUM(s.redCards), 0)
            FROM Stat s
            WHERE s.match.competition.season.current = true
              AND s.match.status = es.adri.demo.model.MatchStatus.FINISHED
            GROUP BY s.player.id
            """)
    List<Object[]> sumCardsByCurrentSeason();

    @Query("""
            SELECT s.player.id, COALESCE(SUM(s.assists), 0),
                   COALESCE(SUM(s.yellowCards), 0), COALESCE(SUM(s.redCards), 0)
            FROM Stat s
            WHERE s.match.competition.season.id = :seasonId
              AND s.match.status = es.adri.demo.model.MatchStatus.FINISHED
            GROUP BY s.player.id
            """)
    List<Object[]> sumCardsBySeason(@Param("seasonId") Long seasonId);

    @Query("""
            SELECT s.player.id, COUNT(s.id)
            FROM Stat s
            WHERE s.attended = true
              AND s.match.competition.season.current = true
              AND s.match.status = es.adri.demo.model.MatchStatus.FINISHED
            GROUP BY s.player.id
            """)
    List<Object[]> countAppearancesByCurrentSeasonFromStat();

    @Query("""
            SELECT s.player.id, COUNT(s.id)
            FROM Stat s
            WHERE s.attended = true
              AND s.match.competition.season.id = :seasonId
              AND s.match.status = es.adri.demo.model.MatchStatus.FINISHED
            GROUP BY s.player.id
            """)
    List<Object[]> countAppearancesBySeasonFromStat(@Param("seasonId") Long seasonId);

    @Query("""
            SELECT s.player.id, COUNT(s.id)
            FROM Stat s
            WHERE s.attended = true
              AND s.player.position = es.adri.demo.model.Position.PORTERO
              AND s.match.rivalGoals = 0
              AND s.match.competition.season.current = true
              AND s.match.status = es.adri.demo.model.MatchStatus.FINISHED
            GROUP BY s.player.id
            """)
    List<Object[]> countCleanSheetsByCurrentSeason();

    @Query("""
            SELECT s.player.id, COUNT(s.id)
            FROM Stat s
            WHERE s.attended = true
              AND s.player.position = es.adri.demo.model.Position.PORTERO
              AND s.match.rivalGoals = 0
              AND s.match.competition.season.id = :seasonId
              AND s.match.status = es.adri.demo.model.MatchStatus.FINISHED
            GROUP BY s.player.id
            """)
    List<Object[]> countCleanSheetsBySeason(@Param("seasonId") Long seasonId);

    @Query("""
            SELECT s FROM Stat s
            WHERE s.match.competition.season.id = :seasonId
            """)
    Page<Stat> findBySeasonId(@Param("seasonId") Long seasonId, Pageable pageable);

    @Query("""
            SELECT s FROM Stat s
            WHERE (:seasonId IS NULL OR s.match.competition.season.id = :seasonId)
              AND (LOWER(s.player.name) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(s.player.nickname) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(s.match.rival) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<Stat> findBySeasonAndSearch(@Param("seasonId") Long seasonId, @Param("search") String search, Pageable pageable);

    @Query("""
            SELECT s FROM Stat s
            WHERE LOWER(s.player.name) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(s.player.nickname) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(s.match.rival) LIKE LOWER(CONCAT('%', :search, '%'))
            """)
    Page<Stat> findBySearch(@Param("search") String search, Pageable pageable);
}
