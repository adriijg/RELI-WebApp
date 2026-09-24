package es.adri.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StatsScrapeResultDTO {
    private int actasProcessed;
    private int callupsCreated;
    private int goalsCreated;
    private int statsCreated;
    private int statsUpdated;
    private int playersCreated;
    private String message;
}
