package es.adri.demo.dto;

import es.adri.demo.model.MatchPhase;
import es.adri.demo.model.MatchStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class MatchRequestDTO {

    @NotBlank(message = "El rival es obligatorio")
    private String rival;

    private boolean home = true;

    private LocalDateTime date;

    private String location;

    @NotNull(message = "El estado del partido es obligatorio")
    private MatchStatus status;

    @Min(value = 0, message = "Nuestros goles no pueden ser negativos")
    private Integer ourGoals;

    @Min(value = 0, message = "Los goles del rival no pueden ser negativos")
    private Integer rivalGoals;

    private Integer jornada;

    @NotNull(message = "La competicion es obligatoria")
    private Long competitionId;

    private MatchPhase phase;

    private String groupName;

    private Boolean manual;

    public MatchRequestDTO(String rival, boolean home, LocalDateTime date, String location, MatchStatus status,
                           Integer ourGoals, Integer rivalGoals, Integer jornada, Long competitionId,
                           MatchPhase phase, String groupName, Boolean manual) {
        this.rival = rival;
        this.home = home;
        this.date = date;
        this.location = location;
        this.status = status;
        this.ourGoals = ourGoals;
        this.rivalGoals = rivalGoals;
        this.jornada = jornada;
        this.competitionId = competitionId;
        this.phase = phase;
        this.groupName = groupName;
        this.manual = manual;
    }

    public MatchRequestDTO(String rival, boolean home, LocalDateTime date, String location, MatchStatus status,
                           Integer ourGoals, Integer rivalGoals, Integer jornada, Long competitionId) {
        this(rival, home, date, location, status, ourGoals, rivalGoals, jornada, competitionId, null, null, null);
    }

    public MatchRequestDTO(String rival, boolean home, LocalDateTime date, String location, MatchStatus status,
                           Integer ourGoals, Integer rivalGoals, Integer jornada, Long competitionId,
                           MatchPhase phase, String groupName) {
        this(rival, home, date, location, status, ourGoals, rivalGoals, jornada, competitionId, phase, groupName, null);
    }
}
