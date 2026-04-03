package es.adri.demo.repository;

import es.adri.demo.model.Stat;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StatRepository extends JpaRepository<Stat, Long> {

    List<Stat> findByPlayerId(Long playerId);

    List<Stat> findByMatchId(Long matchId);
}
