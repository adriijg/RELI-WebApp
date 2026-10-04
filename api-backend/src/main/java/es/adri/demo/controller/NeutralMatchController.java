package es.adri.demo.controller;

import es.adri.demo.dto.NeutralMatchDTO;
import es.adri.demo.service.NeutralMatchService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Partidos neutros (sin el Real Lisiados): lectura pública, escritura solo admin.
 */
@RestController
@RequestMapping("/api/neutral-matches")
public class NeutralMatchController {

    private final NeutralMatchService service;

    public NeutralMatchController(NeutralMatchService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<NeutralMatchDTO>> list(
            @RequestParam Long competitionId,
            @RequestParam(required = false) Integer jornada) {
        return ResponseEntity.ok(service.list(competitionId, jornada));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<NeutralMatchDTO> upsert(@Valid @RequestBody NeutralMatchDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.upsert(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<NeutralMatchDTO> update(@PathVariable Long id, @Valid @RequestBody NeutralMatchDTO dto) {
        dto.setId(id);
        return ResponseEntity.ok(service.upsert(dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
