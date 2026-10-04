package es.adri.demo.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Partido de la jornada que NO juega el Real Lisiados.
 * Guarda correcciones manuales (fecha, sede, resultado, acta) sobre los
 * datos que vienen de la federación (JSON estático / scrapeo por jornada).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "neutral_matches", uniqueConstraints = {
        @UniqueConstraint(name = "uq_neutral_match", columnNames = { "competition_id", "jornada", "home_code", "away_code" })
})
public class NeutralMatch extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "competition_id", nullable = false)
    private Competition competition;

    @Column(nullable = false)
    private Integer jornada;

    @Column(nullable = false)
    private String homeName;

    @Column(nullable = false)
    private String awayName;

    private String homeCode;

    private String awayCode;

    private LocalDateTime date;

    private String venue;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MatchStatus status = MatchStatus.SCHEDULED;

    private Integer homeGoals;

    private Integer awayGoals;

    /** CodActa de la federación, para descargar el acta sin re-scrapear la jornada. */
    private String codacta;
}
