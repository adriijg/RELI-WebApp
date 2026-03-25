package es.adri.demo.dto;

import es.adri.demo.model.Role;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {

    private Long id;
    private String username;
    private String email;
    private Role role;
    private LocalDateTime createdAt;
}
