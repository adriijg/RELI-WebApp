package es.adri.demo.repository;

import es.adri.demo.model.Competition;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CompetitionRepository extends JpaRepository<Competition, Long> {

    List<Competition> findBySeasonId(Long seasonId);
}
