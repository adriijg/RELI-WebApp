package es.adri.demo.repository;

import es.adri.demo.model.Match;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MatchRepository extends JpaRepository<Match, Long> {

    List<Match> findByCompetitionId(Long competitionId);

    org.springframework.data.domain.Page<Match> findByStatus(es.adri.demo.model.MatchStatus status, org.springframework.data.domain.Pageable pageable);

    @Query("SELECT m FROM Match m WHERE m.rival = :rival AND m.status = es.adri.demo.model.MatchStatus.FINISHED "
            + "AND m.id <> :excludeId ORDER BY m.date DESC")
    List<Match> findFinishedByRival(@Param("rival") String rival, @Param("excludeId") Long excludeId);

    @Query("SELECT m FROM Match m WHERE m.rival = :rival AND m.status = es.adri.demo.model.MatchStatus.FINISHED "
            + "AND m.id <> :excludeId ORDER BY m.date DESC")
    List<Match> findRecentByRival(@Param("rival") String rival, @Param("excludeId") Long excludeId,
            org.springframework.data.domain.Pageable pageable);

    @EntityGraph(attributePaths = "competition")
    Optional<Match> findWithCompetitionById(Long id);

    @Modifying
    @Query("UPDATE Match m SET m.status = es.adri.demo.model.MatchStatus.IN_PROGRESS "
            + "WHERE m.status = es.adri.demo.model.MatchStatus.SCHEDULED "
            + "AND m.date IS NOT NULL AND m.date <= :now")
    int startDueMatches(@Param("now") LocalDateTime now);

    @Modifying
    @Query("UPDATE Match m SET m.status = es.adri.demo.model.MatchStatus.FINISHED "
            + "WHERE m.status = es.adri.demo.model.MatchStatus.IN_PROGRESS "
            + "AND m.date IS NOT NULL AND m.date <= :cutoff")
    int finishExpiredMatches(@Param("cutoff") LocalDateTime cutoff);

    @Modifying
    @Query("DELETE FROM MatchGoal g WHERE g.match.id = :matchId")
    void deleteGoalsByMatchId(@Param("matchId") Long matchId);

    @Modifying
    @Query("DELETE FROM MatchCallUp c WHERE c.match.id = :matchId")
    void deleteCallUpsByMatchId(@Param("matchId") Long matchId);
}
