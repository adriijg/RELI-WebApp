package es.adri.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class QuintetRankDTO {

    private Long playerId;
    private int votes;
}
