package es.adri.demo.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MatchDetailDTO {

    private MatchDTO match;
    private List<StatDTO> stats;
    private RivalInfoDTO rivalInfo;
}
