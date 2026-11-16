package es.adri.demo.config;

import jakarta.annotation.PostConstruct;
import java.sql.Connection;
import java.sql.Statement;
import javax.sql.DataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Garantiza que las columnas nuevas con restricción NOT NULL tengan su valor por defecto
 * en bases de datos PostgreSQL/Supabase que ya contienen registros previos.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class DatabaseSchemaBootstrapRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseSchemaBootstrapRunner.class);

    private final DataSource dataSource;

    public DatabaseSchemaBootstrapRunner(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @PostConstruct
    public void ensureColumnsExist() {
        String[] statements = {
            "ALTER TABLE matches ADD COLUMN IF NOT EXISTS manual BOOLEAN NOT NULL DEFAULT FALSE",
            "ALTER TABLE neutral_matches ADD COLUMN IF NOT EXISTS manual BOOLEAN NOT NULL DEFAULT FALSE"
        };

        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            for (String sql : statements) {
                try {
                    stmt.execute(sql);
                } catch (Exception ex) {
                    log.debug("Omitiendo sentencia de migración '{}': {}", sql, ex.getMessage());
                }
            }
        } catch (Exception ex) {
            log.warn("No se pudo verificar el esquema inicial de columnas manual: {}", ex.getMessage());
        }
    }
}
