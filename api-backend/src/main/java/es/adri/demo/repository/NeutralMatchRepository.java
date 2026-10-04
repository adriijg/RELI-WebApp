package es.adri.demo.repository;

import es.adri.demo.model.NeutralMatch;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NeutralMatchRepository extends JpaRepository<NeutralMatch, Long> {

    List<NeutralMatch> findByCompetitionId(Long competitionId);

    List<NeutralMatch> findByCompetitionIdAndJornada(Long competitionId, Integer jornada);

    Optional<NeutralMatch> findByCompetitionIdAndJornadaAndHomeCodeAndAwayCode(
            Long competitionId, Integer jornada, String homeCode, String awayCode);
}
