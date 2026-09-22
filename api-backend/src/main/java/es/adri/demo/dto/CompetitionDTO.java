package es.adri.demo.dto;

import es.adri.demo.model.CompetitionType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CompetitionDTO {

    private Long id;
    private String name;
    private CompetitionType type;
    private Long seasonId;
    private String seasonName;
    private String ffmCompeticion;
    private String ffmGrupo;
    private String ffmTemporada;
    private String ffmOurCode;
}
