package es.adri.demo.controller;

import es.adri.demo.dto.PagedResponseDTO;
import es.adri.demo.dto.EventCreateDTO;
import es.adri.demo.dto.EventDTO;
import es.adri.demo.service.EventService;
import jakarta.validation.Valid;
import java.security.Principal;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EventDTO> createEvent(@Valid @RequestBody EventCreateDTO eventCreateDTO, Principal principal) {
        EventDTO eventDTO = eventService.createEvent(eventCreateDTO, principal.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(eventDTO);
    }

    @GetMapping
    public ResponseEntity<PagedResponseDTO<EventDTO>> getAllEvents(
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "0") int page,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "10") int size,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "date") String sortBy,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "desc") String direction
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.fromString(direction), sortBy));
        return ResponseEntity.ok(eventService.findAllEvents(pageable));
    }
}
