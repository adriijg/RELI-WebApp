package es.adri.demo.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FfmSyncResultDTO {

    private Long competitionId;
    private String competitionName;
    private int roundsChecked;
    private int created;
    private int updated;
    private int unchanged;
    private List<Integer> restWeeks;
    private List<FfmSyncActionDTO> actions;
    private Long runId;
}
