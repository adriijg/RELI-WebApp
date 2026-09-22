package es.adri.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FfmSyncActionDTO {

    private Integer jornada;
    private String rival;
    private Boolean home;
    private String date;
    private String venue;
    private String status;
    // CREATED, UPDATED, UNCHANGED
    private String action;
    private String detail;
}
