package es.adri.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StatDTO {

    private Long id;
    private Long playerId;
    private String playerName;
    private Long matchId;
    private String matchRival;
    private Integer goals;
    private Integer assists;
    private Integer yellowCards;
    private Integer redCards;
    private boolean mvp;
    private boolean attended;
}
