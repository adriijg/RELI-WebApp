package es.adri.demo.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MatchCallUpRequestDTO {

    @NotNull(message = "El jugador es obligatorio")
    private Long playerId;
}
