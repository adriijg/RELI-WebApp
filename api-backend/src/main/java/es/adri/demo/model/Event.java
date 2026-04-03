package es.adri.demo.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "events")
public class Event extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT") // Para descripciones largas
    private String description;

    @Column(nullable = false)
    private LocalDateTime date;

    private String location;

    private String imageUrl; // Para miniaturas en la web

    @Enumerated(EnumType.STRING)
    private EventType type; // SOCIAL, TRAINING, MEETING, INFO

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    private User createdBy;
}
