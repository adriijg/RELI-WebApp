package es.adri.demo.controller;

import es.adri.demo.dto.RoundActaDTO;
import es.adri.demo.service.FfmActaService;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Actas de UNA jornada bajo demanda (solo admin).
 * Pocas peticiones (~3 para listar, ~2 por acta) con pausas entre ellas.
 */
@RestController
@RequestMapping("/api/admin/ffm-actas")
@PreAuthorize("hasRole('ADMIN')")
public class FfmActaController {

    private final FfmActaService ffmActaService;

    public FfmActaController(FfmActaService ffmActaService) {
        this.ffmActaService = ffmActaService;
    }

    @GetMapping("/jornada")
    public ResponseEntity<List<RoundActaDTO>> roundActas(
            @RequestParam Long competitionId,
            @RequestParam int jornada) {
        return ResponseEntity.ok(ffmActaService.listRoundActas(competitionId, jornada));
    }

    @GetMapping(value = "/{codacta}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> actaHtml(
            @PathVariable String codacta,
            @RequestParam(required = false) String expectedHome,
            @RequestParam(required = false) String expectedAway) {
        String html = ffmActaService.fetchActaHtml(codacta, expectedHome, expectedAway);
        return ResponseEntity.ok().contentType(new MediaType("text", "html", StandardCharsets.UTF_8)).body(html);
    }

    @GetMapping("/{codacta}/pdf")
    public ResponseEntity<byte[]> actaPdf(@PathVariable String codacta) {
        byte[] pdf = ffmActaService.fetchActaPdf(codacta);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition
                        .attachment().filename("acta-" + codacta + ".pdf").build().toString())
                .body(pdf);
    }
}
