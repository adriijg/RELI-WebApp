package es.adri.demo.repository;

import es.adri.demo.model.Season;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SeasonRepository extends JpaRepository<Season, Long> {

    Optional<Season> findByCurrentTrue();
}
