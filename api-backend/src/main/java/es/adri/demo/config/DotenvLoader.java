package es.adri.demo.config;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Properties;
import org.springframework.stereotype.Component;

@Component
public class DotenvLoader {

    @PostConstruct
    public void load() {
        Path env = Paths.get("api-backend/.env");
        if (!Files.exists(env)) env = Paths.get(".env");
        if (!Files.exists(env)) env = Paths.get(System.getProperty("user.dir"), "api-backend/.env");
        if (!Files.exists(env)) return;
        try {
            Properties props = new Properties();
            // .env is simple key=value, not Java properties escaped, so read manually
            for (String line : Files.readAllLines(env)) {
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#")) continue;
                int eq = line.indexOf('=');
                if (eq < 0) continue;
                String key = line.substring(0, eq).trim();
                String value = line.substring(eq + 1).trim();
                if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.substring(1, value.length() - 1);
                }
                if (System.getenv(key) == null && System.getProperty(key) == null) {
                    System.setProperty(key, value);
                }
            }
        } catch (IOException ignored) {}
    }
}
