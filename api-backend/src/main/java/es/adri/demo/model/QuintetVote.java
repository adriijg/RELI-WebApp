package es.adri.demo.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
        name = "quintet_votes",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "season_id", "jornada"})
)
public class QuintetVote extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "season_id", nullable = false)
    private Long seasonId;

    @Column(nullable = false)
    private Integer jornada;

    @Column(name = "match_id")
    private Long matchId;

    @Column(name = "slot1", nullable = false)
    private Long slot1;

    @Column(name = "slot2", nullable = false)
    private Long slot2;

    @Column(name = "slot3", nullable = false)
    private Long slot3;

    @Column(name = "slot4", nullable = false)
    private Long slot4;

    @Column(name = "slot5", nullable = false)
    private Long slot5;

    public List<Long> playerIds() {
        return List.of(slot1, slot2, slot3, slot4, slot5);
    }

    public void setPlayerIds(List<Long> playerIds) {
        slot1 = playerIds.get(0);
        slot2 = playerIds.get(1);
        slot3 = playerIds.get(2);
        slot4 = playerIds.get(3);
        slot5 = playerIds.get(4);
    }
}
