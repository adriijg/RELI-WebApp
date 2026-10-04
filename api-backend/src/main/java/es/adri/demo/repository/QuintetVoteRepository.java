package es.adri.demo.repository;

import es.adri.demo.model.QuintetVote;
import es.adri.demo.model.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuintetVoteRepository extends JpaRepository<QuintetVote, Long> {

    Optional<QuintetVote> findByUserIdAndSeasonIdAndJornada(Long userId, Long seasonId, Integer jornada);

    List<QuintetVote> findBySeasonIdAndJornadaOrderByCreatedAtAsc(Long seasonId, Integer jornada);

    List<QuintetVote> findBySeasonId(Long seasonId);

    void deleteAllByUser(User user);
}
