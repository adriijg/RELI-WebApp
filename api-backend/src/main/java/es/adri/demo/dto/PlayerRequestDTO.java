package es.adri.demo.dto;

import es.adri.demo.model.Position;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.hibernate.validator.constraints.URL;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlayerRequestDTO {

    @NotBlank(message = "El nombre es obligatorio")
    private String name;

    private String nickname;

    @NotNull(message = "El dorsal es obligatorio")
    @Min(value = 1, message = "El dorsal debe estar entre 1 y 99")
    @Max(value = 99, message = "El dorsal debe estar entre 1 y 99")
    private Integer jerseyNumber;

    @NotNull(message = "La posicion es obligatoria")
    private Position position;

    @NotBlank(message = "La foto es obligatoria")
    @URL(message = "La URL de la foto no es valida")
    private String photoUrl;
}
