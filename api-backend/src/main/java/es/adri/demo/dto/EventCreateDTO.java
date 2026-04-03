package es.adri.demo.dto;

import es.adri.demo.model.EventType;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.validator.constraints.URL;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EventCreateDTO {

    @NotBlank(message = "El titulo es obligatorio")
    private String title;

    private String description;

    @NotNull(message = "La fecha es obligatoria")
    @Future(message = "La fecha del evento debe estar en el futuro")
    private LocalDateTime date;

    @NotBlank(message = "La ubicacion es obligatoria")
    private String location;

    @URL(message = "La URL de la imagen no es valida")
    private String imageUrl;

    @NotNull(message = "El tipo de evento es obligatorio")
    private EventType type;
}
