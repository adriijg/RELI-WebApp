package es.adri.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StandingDTO {

    private String teamName;
    private boolean isUs;
    private int played;
    private int won;
    private int drawn;
    private int lost;
    private int goalsFor;
    private int goalsAgainst;
    private int goalDifference;
    private int points;
    // Ultimos resultados (maximo 5, de mas antiguo a mas reciente): V = victoria, E = empate, D = derrota
    private String form;
}
