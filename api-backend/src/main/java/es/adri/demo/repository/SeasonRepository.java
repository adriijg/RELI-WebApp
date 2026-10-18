package es.adri.demo.repository;

import es.adri.demo.model.Season;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SeasonRepository extends JpaRepository<Season, Long> {

    Optional<Season> findByCurrentTrue();

    boolean existsByName(String name);

    @Query("SELECT s FROM Season s WHERE LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Season> findBySearch(@Param("search") String search, Pageable pageable);
}
