package es.adri.demo.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EventCreateDTO {

    @NotBlank(message = "El equipo local es obligatorio")
    private String homeTeam;

    @NotBlank(message = "El equipo visitante es obligatorio")
    private String awayTeam;

    @NotNull(message = "La fecha es obligatoria")
    @Future(message = "La fecha del evento debe estar en el futuro")
    private LocalDateTime date;

    @NotBlank(message = "La ubicacion es obligatoria")
    private String location;

    @NotBlank(message = "El marcador es obligatorio")
    private String score;
}
