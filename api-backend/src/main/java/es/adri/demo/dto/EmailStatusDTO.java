package es.adri.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmailStatusDTO {

    private boolean enabled;
    private boolean apiKeyConfigured;
    private String from;
    private boolean fromConfigured;
    private String frontendUrl;
}
