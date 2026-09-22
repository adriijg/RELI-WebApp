package es.adri.demo.service;

import es.adri.demo.dto.EventCreateDTO;
import es.adri.demo.dto.EventDTO;
import es.adri.demo.dto.EventUpdateDTO;
import es.adri.demo.dto.PagedResponseDTO;
import es.adri.demo.exception.ResourceNotFoundException;
import es.adri.demo.model.Event;
import es.adri.demo.model.User;
import es.adri.demo.repository.EventRepository;
import es.adri.demo.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class EventService {

    private final EventRepository eventRepository;
    private final UserRepository userRepository;

    public EventService(EventRepository eventRepository, UserRepository userRepository) {
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
    }

    @Transactional
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

    public PagedResponseDTO<EventDTO> findAllEvents(Pageable pageable) {
        Page<EventDTO> page = eventRepository.findAll(pageable)
                .map(this::toDto);
        return toPagedResponse(page);
    }

    public EventDTO findEventById(Long id) {
        return toDto(getEventEntityById(id));
    }

    @Transactional
    public EventDTO updateEvent(Long id, EventUpdateDTO eventUpdateDTO, String username) {
        Event event = getEventEntityById(id);

        User adminUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        event.setTitle(eventUpdateDTO.getTitle());
        event.setDescription(eventUpdateDTO.getDescription());
        event.setDate(eventUpdateDTO.getDate());
        event.setLocation(eventUpdateDTO.getLocation());
        event.setImageUrl(eventUpdateDTO.getImageUrl());
        event.setType(eventUpdateDTO.getType());
        event.setCreatedBy(adminUser);

        return toDto(eventRepository.save(event));
    }

    @Transactional
    public void deleteEvent(Long id) {
        eventRepository.delete(getEventEntityById(id));
    }

    private Event getEventEntityById(Long id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evento no encontrado"));
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
                event.getCreatedBy() != null ? event.getCreatedBy().getId() : null,
                event.getCreatedBy() != null ? event.getCreatedBy().getUsername() : null
        );
    }

    private PagedResponseDTO<EventDTO> toPagedResponse(Page<EventDTO> page) {
        return new PagedResponseDTO<>(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast()
        );
    }
}

