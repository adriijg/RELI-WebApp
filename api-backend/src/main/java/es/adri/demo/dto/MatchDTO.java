package es.adri.demo.dto;

import es.adri.demo.model.MatchStatus;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MatchDTO {

    private Long id;
    private String rival;
    private LocalDateTime date;
    private String location;
    private MatchStatus status;
    private Integer ourGoals;
    private Integer rivalGoals;
    private Long competitionId;
    private String competitionName;
}
