package es.adri.demo.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ffm_sync_runs")
public class FfmSyncRun extends BaseEntity {

    public enum Status {
        OK,
        PARTIAL,
        FAILED
    }

    public enum Trigger {
        MANUAL,
        SCHEDULED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long competitionId;

    private String competitionName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Trigger triggeredBy = Trigger.MANUAL;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.OK;

    private LocalDateTime startedAt = LocalDateTime.now();

    private LocalDateTime finishedAt;

    private int roundsChecked;

    private int created;

    private int updated;

    private int unchanged;

    @Column(length = 2000)
    private String error;
}
