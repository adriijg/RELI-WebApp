package es.adri.demo.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.bootstrap-admin")
public class AdminBootstrapProperties {

    private boolean enabled = true;
    private String username;
    private String email;
    private String password;
}
