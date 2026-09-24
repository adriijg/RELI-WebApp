package es.adri.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScrapedPlayerDTO {
    private String fullName;
    private String name;
    private String surnames;
    private Integer jerseyNumber;
    private Integer appearances;
}
