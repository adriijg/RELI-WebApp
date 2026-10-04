package es.adri.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoundActaDTO {
    private Integer jornada;
    private String home;
    private String away;
    private String homeCode;
    private String awayCode;
    private String date;
    private String venue;
    private Integer homeGoals;
    private Integer awayGoals;
    private boolean ours;
    /** CodActa de la federación. Null si la jornada aún no tiene acta publicada para ese partido. */
    private String codacta;
}
