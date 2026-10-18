package es.adri.demo.repository;

import es.adri.demo.model.User;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByUsernameAndIdNot(String username, Long id);

    boolean existsByEmailAndIdNot(String email, Long id);

    java.util.List<User> findByEmailVerifiedTrue();

    Optional<User> findByGoogleId(String googleId);

    @Query("SELECT u FROM User u WHERE LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%')) "
            + "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<User> findBySearch(@Param("search") String search, Pageable pageable);
}
