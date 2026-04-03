package es.adri.demo.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SeasonRequestDTO {

    @NotBlank(message = "El nombre de la temporada es obligatorio")
    private String name;

    private boolean current;
}
