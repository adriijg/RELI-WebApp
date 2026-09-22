package es.adri.demo.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Sincronizacion programada con la federacion (lunes y jueves a las 08:00).
 * Apagada por defecto: se activa con {@code app.ffm.sync-schedule-enabled=true}
 * cuando el backend corra en un hosting fijo. Las credenciales van por
 * variables de entorno (FFM_USER / FFM_PASS), nunca en el repo.
 */
@Component
@ConditionalOnProperty(name = "app.ffm.sync-schedule-enabled", havingValue = "true")
public class FfmSyncScheduler {

    private static final Logger log = LoggerFactory.getLogger(FfmSyncScheduler.class);

    private final FfmSyncService ffmSyncService;

    public FfmSyncScheduler(FfmSyncService ffmSyncService) {
        this.ffmSyncService = ffmSyncService;
    }

    @Scheduled(cron = "${app.ffm.sync-cron:0 0 8 * * MON,THU}")
    public void runScheduledSync() {
        log.info("Sincronizacion programada FFM: inicio");
        try {
            ffmSyncService.syncAllScheduled();
            log.info("Sincronizacion programada FFM: fin");
        } catch (Exception e) {
            log.error("Sincronizacion programada FFM: error general", e);
        }
    }
}
