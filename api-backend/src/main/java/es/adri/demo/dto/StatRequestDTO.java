package es.adri.demo.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StatRequestDTO {

    @NotNull(message = "El jugador es obligatorio")
    private Long playerId;

    @NotNull(message = "El partido es obligatorio")
    private Long matchId;

    @NotNull(message = "Los goles son obligatorios")
    @Min(value = 0, message = "Los goles no pueden ser negativos")
    private Integer goals;

    @NotNull(message = "Las asistencias son obligatorias")
    @Min(value = 0, message = "Las asistencias no pueden ser negativas")
    private Integer assists;

    @NotNull(message = "Las amarillas son obligatorias")
    @Min(value = 0, message = "Las amarillas no pueden ser negativas")
    private Integer yellowCards;

    @NotNull(message = "Las rojas son obligatorias")
    @Min(value = 0, message = "Las rojas no pueden ser negativas")
    private Integer redCards;

    private boolean mvp;

    private boolean attended;
}
