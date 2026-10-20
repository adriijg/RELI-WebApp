package es.adri.demo.repository;

import es.adri.demo.model.Competition;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CompetitionRepository extends JpaRepository<Competition, Long> {

    List<Competition> findBySeasonId(Long seasonId);

    @Override
    @EntityGraph(attributePaths = "season")
    Page<Competition> findAll(Pageable pageable);

    @EntityGraph(attributePaths = "season")
    @Query("SELECT c FROM Competition c WHERE LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Competition> findBySearch(@Param("search") String search, Pageable pageable);
}
