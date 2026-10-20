package es.adri.demo.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlayerMatchStatDTO {

    private Long id;
    private Long matchId;
    private String rival;
    private boolean home;
    private LocalDateTime date;
    private Integer jornada;
    private Integer goals;
    private Integer yellowCards;
    private Integer redCards;
    private boolean mvp;
}
