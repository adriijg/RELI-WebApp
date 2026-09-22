package es.adri.demo;

import es.adri.demo.service.FfmSyncService;
import es.adri.demo.service.FfmSyncService.FfmMatch;
import java.util.List;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class FfmSyncServiceTest {

    @Test
    void normIgnoresCaseAccentsAndPunctuation() {
        assertEquals("CLIMAHILLO FUTSAL", FfmSyncService.norm("Climahillo Futsal"));
        assertEquals("LA REINA CANALLA TATTOO F S", FfmSyncService.norm("LA REINA CANALLA TATTOO F.S"));
    }

    @Test
    void smartTitleRespectsAcronymsAndConnectors() {
        assertEquals("El Vaquilla FS", FfmSyncService.smartTitle("EL VAQUILLA FS"));
        assertEquals("Fuera de Juego", FfmSyncService.smartTitle("FUERA DE JUEGO"));
        assertEquals("Cubrasl F.S.", FfmSyncService.smartTitle("CUBRASL F.S."));
        assertEquals("Real Lisiados", FfmSyncService.smartTitle("REAL LISIADOS"));
    }

    @Test
    void roundRangeReadsJornadaSelect() {
        String html = "<select name=\"jornada\">"
                + "<option value=\"0\">-- Seleccione --</option>"
                + "<option value=\"1\">1 - 27-09-2026</option>"
                + "<option value=\"2\">2 - 04-10-2026</option>"
                + "</select>";
        assertEquals(List.of(1, 2), FfmSyncService.roundRange(html));
    }

    @Test
    void parseJornadaUsesComparativaPairs() {
        String html = "<select name=\"jornada\">"
                + "<option value=\"1\" selected>1 - 27-09-2026</option>"
                + "</select>"
                + "<span><i class=\"fa fa-clock-o\" aria-hidden=\"true\"></i>27-09-2026&nbsp;&nbsp;</span>"
                + "<span class=\"esconder\">17:10&nbsp;&nbsp;</span>"
                + "<a href=\"NFG_VisEquipos?cod_primaria=1000128&Codigo_Equipo=315337\">CUBRASL F.S.</a>"
                + "<a href=\"NFG_LstComparativaEquipos?cod_primaria=1001218&competicion=1&grupo=1&equipo1=315337&equipo2=320143\">x</a>"
                + "<span><b>Campo:</b></span>PABELLON NIDO - PISTA"
                + "<a href=\"NFG_VisEquipos?cod_primaria=1000128&Codigo_Equipo=320143\">REAL LISIADOS</a>"
                // copia duplicada tal como la sirve la web
                + "<span><i class=\"fa fa-clock-o\" aria-hidden=\"true\"></i>27-09-2026&nbsp;&nbsp;</span>"
                + "<span class=\"esconder\">17:10&nbsp;&nbsp;</span>"
                + "<a href=\"NFG_VisEquipos?cod_primaria=1000128&Codigo_Equipo=315337\">CUBRASL F.S.</a>"
                + "<a href=\"NFG_LstComparativaEquipos?cod_primaria=1001218&competicion=1&grupo=1&equipo1=315337&equipo2=320143\">x</a>"
                + "<span><b>Campo:</b></span>PABELLON NIDO - PISTA"
                + "<a href=\"NFG_VisEquipos?cod_primaria=1000128&Codigo_Equipo=320143\">REAL LISIADOS</a>";

        List<FfmMatch> matches = FfmSyncService.parseJornada(html, 1, "320143");

        assertEquals(1, matches.size());
        FfmMatch match = matches.get(0);
        assertEquals("315337", match.homeCode());
        assertEquals("320143", match.awayCode());
        assertTrue(match.wePlay());
        assertFalse(match.weAreHome());
        assertEquals("2026-09-27T17:10", match.date().toString());
        assertEquals("PABELLON NIDO - PISTA", match.venue());
        assertNull(match.homeGoals());
    }
}
