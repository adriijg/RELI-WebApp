package es.adri.demo.repository;

import es.adri.demo.model.FfmSyncRun;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FfmSyncRunRepository extends JpaRepository<FfmSyncRun, Long> {

    List<FfmSyncRun> findTop20ByOrderByStartedAtDesc();
}
