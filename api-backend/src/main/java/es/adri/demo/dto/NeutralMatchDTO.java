package es.adri.demo.dto;

import es.adri.demo.model.MatchStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NeutralMatchDTO {
    private Long id;
    private Long competitionId;
    private Integer jornada;
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
}
