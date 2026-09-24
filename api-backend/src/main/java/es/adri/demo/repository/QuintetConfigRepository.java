package es.adri.demo.repository;

import es.adri.demo.model.QuintetConfig;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuintetConfigRepository extends JpaRepository<QuintetConfig, Long> {

    Optional<QuintetConfig> findBySeasonIdAndJornada(Long seasonId, Integer jornada);

    List<QuintetConfig> findByOpenTrue();
}
