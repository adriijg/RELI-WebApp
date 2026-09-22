package es.adri.demo.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RivalInfoDTO {

    private String rivalName;
    private List<MatchDTO> recentMatches;
    private List<MatchDTO> headToHead;
    private int rivalWins;
    private int draws;
    private int ourWins;
}
