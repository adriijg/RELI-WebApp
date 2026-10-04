package es.adri.demo;

import es.adri.demo.service.EmailTemplateService;
import java.lang.reflect.Field;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

/** Smoke test de la plantilla de correos (sin enviar nada, sin contexto Spring). */
class EmailTemplateSmokeTest {

    private EmailTemplateService service() throws Exception {
        EmailTemplateService s = new EmailTemplateService();
        Field f = EmailTemplateService.class.getDeclaredField("frontendUrl");
        f.setAccessible(true);
        f.set(s, "https://reallisiados.duckdns.org/auth");
        return s;
    }

    @Test
    void templatesRender() throws Exception {
        EmailTemplateService s = service();
        String test = s.testMail();
        String verify = s.verification("Aficionado", "https://x/?verifyEmail=T");
        String reset = s.passwordReset("https://x/?resetPassword=T");
        String match = s.scheduleWrapper("Próximo partido: Real Lisiados vs CD Ejemplo",
                "<p>Hola</p>", "Ver calendario", "https://x/calendario", null);
        for (String html : new String[]{test, verify, reset, match}) {
            assertTrue(html.contains("cid:reliBadge"), "falta el escudo");
            assertTrue(html.contains("REAL LISIADOS"), "falta la marca");
            assertTrue(html.contains("#E21D2C"), "falta el rojo corporativo");
        }
        String preview = s.withPreviewLogo(test);
        assertTrue(preview.contains("data:image/png;base64,"), "preview sin logo inline");
        assertTrue(!preview.contains("cid:reliBadge"), "preview con cid sin sustituir");
        System.out.println("TEST_MAIL_BYTES=" + test.length() + " PREVIEW_BYTES=" + preview.length());
    }
}
