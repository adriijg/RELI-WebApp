package es.adri.demo.service;

import es.adri.demo.dto.EventCreateDTO;
import es.adri.demo.dto.EventDTO;
import es.adri.demo.exception.ResourceNotFoundException;
import es.adri.demo.model.Event;
import es.adri.demo.model.User;
import es.adri.demo.repository.EventRepository;
import es.adri.demo.repository.UserRepository;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class EventService {

    private final EventRepository eventRepository;
    private final UserRepository userRepository;

    public EventService(EventRepository eventRepository, UserRepository userRepository) {
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
    }

    public EventDTO createEvent(EventCreateDTO eventCreateDTO, String username) {
        User adminUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        Event event = new Event();
        event.setTitle(eventCreateDTO.getTitle());
        event.setDescription(eventCreateDTO.getDescription());
        event.setDate(eventCreateDTO.getDate());
        event.setLocation(eventCreateDTO.getLocation());
        event.setImageUrl(eventCreateDTO.getImageUrl());
        event.setType(eventCreateDTO.getType());
        event.setCreatedBy(adminUser);

        return toDto(eventRepository.save(event));
    }

    public List<EventDTO> findAllEvents() {
        return eventRepository.findAll()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private EventDTO toDto(Event event) {
        return new EventDTO(
                event.getId(),
                event.getTitle(),
                event.getDescription(),
                event.getDate(),
                event.getLocation(),
                event.getImageUrl(),
                event.getType(),
                event.getCreatedBy().getId(),
                event.getCreatedBy().getUsername()
        );
    }
}
