package es.adri.demo.dto;

import es.adri.demo.model.MatchPhase;
import es.adri.demo.model.MatchStatus;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class MatchDTO {

    private Long id;
    private String rival;
    private boolean home;
    private LocalDateTime date;
    private String location;
    private MatchStatus status;
    private Integer ourGoals;
    private Integer rivalGoals;
    private Integer jornada;
    private Long competitionId;
    private String competitionName;
    private MatchPhase phase;
    private String groupName;
    private boolean manual;

    public MatchDTO(Long id, String rival, boolean home, LocalDateTime date, String location,
                    MatchStatus status, Integer ourGoals, Integer rivalGoals, Integer jornada,
                    Long competitionId, String competitionName, MatchPhase phase, String groupName,
                    boolean manual) {
        this.id = id;
        this.rival = rival;
        this.home = home;
        this.date = date;
        this.location = location;
        this.status = status;
        this.ourGoals = ourGoals;
        this.rivalGoals = rivalGoals;
        this.jornada = jornada;
        this.competitionId = competitionId;
        this.competitionName = competitionName;
        this.phase = phase;
        this.groupName = groupName;
        this.manual = manual;
    }

    public MatchDTO(Long id, String rival, boolean home, LocalDateTime date, String location,
                    MatchStatus status, Integer ourGoals, Integer rivalGoals, Integer jornada,
                    Long competitionId, String competitionName, MatchPhase phase, String groupName) {
        this(id, rival, home, date, location, status, ourGoals, rivalGoals, jornada,
                competitionId, competitionName, phase, groupName, false);
    }
}
