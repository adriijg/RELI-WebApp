package es.adri.demo.dto;

import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class QuintetBallotDTO {

    private Long userId;
    private String username;
    private List<Long> playerIds;
    private LocalDateTime votedAt;
}
