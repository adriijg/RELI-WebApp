package es.adri.demo.repository;

import es.adri.demo.dto.PlayerSeasonStatsDTO;
import es.adri.demo.model.Stat;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StatRepository extends JpaRepository<Stat, Long> {

    List<Stat> findByPlayerId(Long playerId);

    List<Stat> findByMatchId(Long matchId);

    Page<Stat> findByPlayerId(Long playerId, Pageable pageable);

    Page<Stat> findByMatchId(Long matchId, Pageable pageable);

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
            SELECT new es.adri.demo.dto.PlayerSeasonStatsDTO(
                s.player.id,
                s.player.name,
                s.player.nickname,
                s.player.surnames,
                s.player.jerseyNumber,
                s.player.position,
                s.player.photoUrl,
                COALESCE(SUM(s.goals), 0),
                COALESCE(SUM(s.assists), 0),
                COALESCE(SUM(s.yellowCards), 0),
                COALESCE(SUM(s.redCards), 0),
                SUM(CASE WHEN s.attended = true THEN 1 ELSE 0 END),
                SUM(CASE WHEN s.attended = true AND s.match.rivalGoals = 0 THEN 1 ELSE 0 END)
            )
            FROM Stat s
            WHERE s.match.competition.season.current = true
              AND s.match.status = es.adri.demo.model.MatchStatus.FINISHED
            GROUP BY s.player.id, s.player.name, s.player.nickname, s.player.surnames,
                     s.player.jerseyNumber, s.player.position, s.player.photoUrl
            ORDER BY s.player.jerseyNumber ASC
            """)
    List<PlayerSeasonStatsDTO> findSeasonStatsForCurrentSeason();
}
