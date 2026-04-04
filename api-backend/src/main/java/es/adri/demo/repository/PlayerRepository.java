package es.adri.demo.repository;

import es.adri.demo.model.Player;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlayerRepository extends JpaRepository<Player, Long> {

    List<Player> findAllByActiveTrue();

    Page<Player> findAllByActiveTrue(Pageable pageable);
}
