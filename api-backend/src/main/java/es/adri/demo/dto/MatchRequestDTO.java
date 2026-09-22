package es.adri.demo.dto;

import es.adri.demo.model.MatchStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MatchRequestDTO {

    @NotBlank(message = "El rival es obligatorio")
    private String rival;

    private boolean home = true;

    private LocalDateTime date;

    private String location;

    @NotNull(message = "El estado del partido es obligatorio")
    private MatchStatus status;

    @Min(value = 0, message = "Nuestros goles no pueden ser negativos")
    private Integer ourGoals;

    @Min(value = 0, message = "Los goles del rival no pueden ser negativos")
    private Integer rivalGoals;

    private Integer jornada;

    @NotNull(message = "La competicion es obligatoria")
    private Long competitionId;
}
