package es.adri.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MatchGoalDTO {

    private Long id;
    private Long playerId;
    private String playerName;
    private Integer jerseyNumber;
    private Integer minute;
}
