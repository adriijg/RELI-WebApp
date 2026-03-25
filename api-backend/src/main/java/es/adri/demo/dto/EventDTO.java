package es.adri.demo.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EventDTO {

    private Long id;
    private String homeTeam;
    private String awayTeam;
    private LocalDateTime date;
    private String location;
    private String score;
    private Long createdById;
    private String createdByUsername;
}
