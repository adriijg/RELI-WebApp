package es.adri.demo.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class EmailTestRequestDTO {

    @NotBlank
    @Email(message = "El email no tiene un formato valido")
    private String to;
}
