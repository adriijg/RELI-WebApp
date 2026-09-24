package es.adri.demo.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlayerSeasonRequestDTO {

    @NotNull(message = "seasonId es obligatorio")
    private Long seasonId;

    @NotNull(message = "playerId es obligatorio")
    private Long playerId;

    @NotNull(message = "El dorsal es obligatorio")
    @Min(value = 1, message = "El dorsal debe estar entre 1 y 99")
    @Max(value = 99, message = "El dorsal debe estar entre 1 y 99")
    private Integer jerseyNumber;
}
