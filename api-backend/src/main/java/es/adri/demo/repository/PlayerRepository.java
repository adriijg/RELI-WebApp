package es.adri.demo.repository;

import es.adri.demo.model.Player;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlayerRepository extends JpaRepository<Player, Long> {

    List<Player> findAllByActiveTrue();
}
