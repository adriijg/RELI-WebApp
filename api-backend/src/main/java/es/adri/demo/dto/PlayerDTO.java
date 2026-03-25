package es.adri.demo.dto;

import es.adri.demo.model.Position;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlayerDTO {

    private Long id;
    private String name;
    private String nickname;
    private Integer jerseyNumber;
    private Position position;
    private String photoUrl;
    private boolean active;
}
