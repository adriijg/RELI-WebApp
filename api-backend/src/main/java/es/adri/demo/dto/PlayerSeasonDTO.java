package es.adri.demo.dto;

import es.adri.demo.model.Position;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlayerSeasonDTO {

    private Long id;
    private Long playerId;
    private Long seasonId;
    private String seasonName;
    private Integer jerseyNumber;
    private String name;
    private String nickname;
    private String surnames;
    private Position position;
    private String photoUrl;
    private boolean active;
}
