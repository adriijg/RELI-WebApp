package es.adri.demo.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class QuintetSeasonTallyDTO {

    private int totalBallots;
    private int totalVotes;
    private List<QuintetRankDTO> ranking;
    private List<QuintetRankDTO> yearlyQuintet;
}
