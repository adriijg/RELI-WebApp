package es.adri.demo.dto;

import es.adri.demo.model.CompetitionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CompetitionRequestDTO {

    @NotBlank(message = "El nombre de la competicion es obligatorio")
    private String name;

    @NotNull(message = "El tipo de competicion es obligatorio")
    private CompetitionType type;

    @NotNull(message = "La temporada es obligatoria")
    private Long seasonId;

    private String ffmCompeticion;

    private String ffmGrupo;

    private String ffmTemporada;

    private String ffmOurCode;
}
