package es.adri.demo.dto;

import es.adri.demo.model.Position;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlayerSeasonStatsDTO {

    private Long playerId;
    private String name;
    private String nickname;
    private String surnames;
    private Integer jerseyNumber;
    private Position position;
    private String photoUrl;
    private long goals;
    private long assists;
    private long yellowCards;
    private long redCards;
    private long appearances;
    private long cleanSheets;
}
