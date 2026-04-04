package es.adri.demo.repository;

import es.adri.demo.model.Stat;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StatRepository extends JpaRepository<Stat, Long> {

    List<Stat> findByPlayerId(Long playerId);

    List<Stat> findByMatchId(Long matchId);

    Page<Stat> findByPlayerId(Long playerId, Pageable pageable);

    Page<Stat> findByMatchId(Long matchId, Pageable pageable);
}
