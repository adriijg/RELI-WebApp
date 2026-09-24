package es.adri.demo.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class QuintetStatusDTO {
    private Long seasonId;
    private Integer jornada;
    private boolean open;
    private LocalDateTime closesAt;
}
