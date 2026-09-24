package es.adri.demo.repository;

import es.adri.demo.model.EmailToken;
import es.adri.demo.model.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmailTokenRepository extends JpaRepository<EmailToken, Long> {

    Optional<EmailToken> findByTokenHashAndType(String tokenHash, EmailToken.Type type);

    void deleteByUserAndType(User user, EmailToken.Type type);
}
