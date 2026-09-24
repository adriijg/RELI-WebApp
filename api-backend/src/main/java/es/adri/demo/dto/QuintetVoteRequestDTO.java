package es.adri.demo.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.Data;

@Data
public class QuintetVoteRequestDTO {

    @NotNull
    private Long seasonId;

    @NotNull
    private Integer jornada;

    private Long matchId;

    @NotNull
    @Size(min = 5, max = 5)
    private List<Long> playerIds;
}
