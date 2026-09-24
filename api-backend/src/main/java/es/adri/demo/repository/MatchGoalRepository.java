package es.adri.demo.repository;

import es.adri.demo.model.MatchGoal;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MatchGoalRepository extends JpaRepository<MatchGoal, Long> {

    List<MatchGoal> findByMatchIdOrderByIdAsc(Long matchId);

    void deleteByMatchId(Long matchId);

    @Query("""
            SELECT g.player.id, COUNT(g.id)
            FROM MatchGoal g
            WHERE g.match.competition.season.current = true
              AND g.match.status = es.adri.demo.model.MatchStatus.FINISHED
            GROUP BY g.player.id
            """)
    List<Object[]> countGoalsByCurrentSeason();

    @Query("""
            SELECT g.player.id, COUNT(g.id)
            FROM MatchGoal g
            WHERE g.match.competition.season.id = :seasonId
              AND g.match.status = es.adri.demo.model.MatchStatus.FINISHED
            GROUP BY g.player.id
            """)
    List<Object[]> countGoalsBySeason(@Param("seasonId") Long seasonId);
}
