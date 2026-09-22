package es.adri.demo.repository;

import es.adri.demo.model.Event;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventRepository extends JpaRepository<Event, Long> {

    @Override
    @EntityGraph(attributePaths = "createdBy")
    Page<Event> findAll(Pageable pageable);

    @Override
    @EntityGraph(attributePaths = "createdBy")
    List<Event> findAll();

    @Override
    @EntityGraph(attributePaths = "createdBy")
    Optional<Event> findById(Long id);
}
