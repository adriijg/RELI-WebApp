package es.adri.demo.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class QuintetTallyDTO {

    private int totalVotes;
    private boolean published;
    private List<QuintetRankDTO> quintet;
    private List<QuintetRankDTO> ranking;
}
