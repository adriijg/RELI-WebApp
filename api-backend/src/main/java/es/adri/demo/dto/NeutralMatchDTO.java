package es.adri.demo.dto;

import es.adri.demo.model.MatchPhase;
import es.adri.demo.model.MatchStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class NeutralMatchDTO {
    private Long id;
    private Long competitionId;
    private Integer jornada;
    private MatchPhase phase;
    private String groupName;
    private String homeName;
    private String awayName;
    private String homeCode;
    private String awayCode;
    private String date;
    private String venue;
    private MatchStatus status;
    private Integer homeGoals;
    private Integer awayGoals;
    private String codacta;
    private Boolean manual;

    public NeutralMatchDTO(Long id, Long competitionId, Integer jornada, MatchPhase phase, String groupName,
                           String homeName, String awayName, String homeCode, String awayCode, String date,
                           String venue, MatchStatus status, Integer homeGoals, Integer awayGoals, String codacta,
                           Boolean manual) {
        this.id = id;
        this.competitionId = competitionId;
        this.jornada = jornada;
        this.phase = phase;
        this.groupName = groupName;
        this.homeName = homeName;
        this.awayName = awayName;
        this.homeCode = homeCode;
        this.awayCode = awayCode;
        this.date = date;
        this.venue = venue;
        this.status = status;
        this.homeGoals = homeGoals;
        this.awayGoals = awayGoals;
        this.codacta = codacta;
        this.manual = manual;
    }

    public NeutralMatchDTO(Long id, Long competitionId, Integer jornada, MatchPhase phase, String groupName,
                           String homeName, String awayName, String homeCode, String awayCode, String date,
                           String venue, MatchStatus status, Integer homeGoals, Integer awayGoals, String codacta) {
        this(id, competitionId, jornada, phase, groupName, homeName, awayName, homeCode, awayCode, date,
                venue, status, homeGoals, awayGoals, codacta, false);
    }
}
