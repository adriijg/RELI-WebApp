package es.adri.demo.repository;

import es.adri.demo.model.Player;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PlayerRepository extends JpaRepository<Player, Long> {

    List<Player> findAllByActiveTrue();

    Page<Player> findAllByActiveTrue(Pageable pageable);

    @Query("SELECT p FROM Player p WHERE p.active = true AND ("
            + "LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) "
            + "OR LOWER(p.nickname) LIKE LOWER(CONCAT('%', :search, '%')) "
            + "OR LOWER(p.surnames) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Player> findActiveBySearch(@Param("search") String search, Pageable pageable);
}
