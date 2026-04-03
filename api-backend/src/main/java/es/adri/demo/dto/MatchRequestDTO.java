package es.adri.demo.dto;

import es.adri.demo.model.MatchStatus;
import jakarta.validation.constraints.FutureOrPresent;
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

    @NotNull(message = "La fecha es obligatoria")
    @FutureOrPresent(message = "La fecha del partido debe ser actual o futura")
    private LocalDateTime date;

    @NotBlank(message = "La ubicacion es obligatoria")
    private String location;

    @NotNull(message = "El estado del partido es obligatorio")
    private MatchStatus status;

    @NotNull(message = "Nuestros goles son obligatorios")
    @Min(value = 0, message = "Nuestros goles no pueden ser negativos")
    private Integer ourGoals;

    @NotNull(message = "Los goles del rival son obligatorios")
    @Min(value = 0, message = "Los goles del rival no pueden ser negativos")
    private Integer rivalGoals;

    @NotNull(message = "La competicion es obligatoria")
    private Long competitionId;
}
