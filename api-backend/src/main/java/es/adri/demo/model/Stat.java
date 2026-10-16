package es.adri.demo.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "stats", uniqueConstraints = {
        @UniqueConstraint(name = "uk_stats_player_match", columnNames = {"player_id", "match_id"})
}, indexes = {
        @Index(name = "idx_stats_match", columnList = "match_id"),
        @Index(name = "idx_stats_player", columnList = "player_id")
})
public class Stat extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "player_id", nullable = false)
    private Player player;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "match_id", nullable = false)
    private Match match;

    @Column(nullable = false)
    private Integer goals;

    @Column(nullable = false)
    private Integer assists;

    @Column(nullable = false)
    private Integer yellowCards;

    @Column(nullable = false)
    private Integer redCards;

    @Column(nullable = false)
    private boolean mvp;

    @Column(nullable = false)
    private boolean attended = false;
}
