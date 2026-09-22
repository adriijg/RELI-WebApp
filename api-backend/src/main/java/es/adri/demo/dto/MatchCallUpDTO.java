package es.adri.demo.dto;

import es.adri.demo.model.Position;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MatchCallUpDTO {

    private Long id;
    private Long playerId;
    private String playerName;
    private Integer jerseyNumber;
    private Position position;
}
