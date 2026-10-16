package es.adri.demo.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users")
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = true, unique = true)
    private String googleId;

    // Existing rows remain usable; new registrations explicitly start unverified.
    private Boolean emailVerified = true;

    // Permiso de voto (quinteto). Los nuevos usuarios empiezan sin permiso;
    // el admin lo habilita desde el panel. Las filas existentes conservan su valor
    // (null se sigue tratando como true para registros previos a la migración).
    private Boolean canVote = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @jakarta.persistence.PrePersist
    void prePersistUser() {
        if (role == null) {
            role = Role.ROLE_USER;
        }
        if (canVote == null) {
            canVote = false;
        }
    }
}
