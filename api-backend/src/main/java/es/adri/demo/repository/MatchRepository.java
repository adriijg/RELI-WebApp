package es.adri.demo.repository;

import es.adri.demo.model.Match;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MatchRepository extends JpaRepository<Match, Long> {

    List<Match> findByCompetitionId(Long competitionId);
}
