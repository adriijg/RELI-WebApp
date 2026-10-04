package es.adri.demo.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Plantilla de correos con el estilo de la web RELI.
 * <p>
 * Replica la identidad visual: cabecera roja (#E21D2C) como el Navbar,
 * tarjeta blanca sobre fondo gris claro (#F8FAFC), acentos dorados (#C19A5B),
 * botón rojo en mayúsculas y pie oscuro (#020617) como el footer.
 * <p>
 * Todo con tablas + estilos inline para compatibilidad con Gmail/Outlook.
 */
@Service
public class EmailTemplateService {

    private static final String RED = "#E21D2C";
    private static final String GOLD = "#C19A5B";
    private static final String GOLD_LIGHT = "#F3E5AB";
    private static final String DARK = "#020617";
    private static final String BG = "#F1F5F9";
    private static final String CARD = "#FFFFFF";
    private static final String TEXT = "#020617";
    private static final String MUTED = "#64748B";
    private static final String FONT = "Arial,Helvetica,sans-serif";

    @Value("${app.email.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    /** Estructura base: wrapper + cabecera roja + tarjeta + pie oscuro. */
    public String layout(String preheader, String kicker, String title, String bodyHtml,
                         String ctaText, String ctaUrl, String fallbackNote) {
        String cta = "";
        if (ctaText != null && !ctaText.isBlank() && ctaUrl != null && !ctaUrl.isBlank()) {
            cta = """
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 8px 0;">
                      <tr><td align="center">
                        <a href="%s" style="display:inline-block;background-color:%s;color:#ffffff;text-decoration:none;font-family:%s;font-size:13px;font-weight:900;letter-spacing:2px;text-transform:uppercase;padding:15px 34px;border-radius:12px;">%s</a>
                      </td></tr>
                    </table>
                    <p style="margin:12px 0 0 0;font-family:%s;font-size:11px;line-height:18px;color:%s;text-align:center;word-break:break-all;">Si el botón no funciona, copia este enlace:<br><a href="%s" style="color:%s;">%s</a></p>
                    """.formatted(ctaUrl, RED, FONT, escape(ctaText), FONT, MUTED, ctaUrl, RED, ctaUrl);
        }
        String note = (fallbackNote == null || fallbackNote.isBlank()) ? ""
                : "<p style=\"margin:20px 0 0 0;font-family:%s;font-size:12px;line-height:19px;color:%s;\">%s</p>".formatted(FONT, MUTED, fallbackNote);

        return """
                <!DOCTYPE html>
                <html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>%s</title></head>
                <body style="margin:0;padding:0;background-color:%s;">
                <span style="display:none;max-height:0;overflow:hidden;opacity:0;">%s</span>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%%" style="background-color:%s;padding:24px 12px;">
                <tr><td align="center">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%%;background-color:%s;border-radius:24px;overflow:hidden;">
                    <!-- Cabecera estilo Navbar -->
                    <tr><td style="background-color:%s;padding:28px 32px 26px 32px;text-align:center;">
                      <img src="cid:reliBadge" width="84" height="84" alt="Real Lisiados F.C." style="display:block;margin:0 auto 12px auto;width:84px;height:84px;border:0;outline:none;" />
                      <p style="margin:0;font-family:%s;font-size:11px;font-weight:900;letter-spacing:4px;color:rgba(255,255,255,0.75);text-transform:uppercase;">Real Lisiados &bull; Est. 2018</p>
                      <p style="margin:8px 0 0 0;font-family:%s;font-size:30px;font-weight:900;font-style:italic;letter-spacing:-1px;color:#ffffff;line-height:32px;">REAL LISIADOS <span style="color:%s;">F.C.</span></p>
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="64" style="margin:14px auto 0 auto;"><tr><td style="background-color:%s;height:4px;border-radius:99px;font-size:0;line-height:0;">&nbsp;</td></tr></table>
                    </td></tr>
                    <!-- Cuerpo -->
                    <tr><td style="padding:32px 32px 12px 32px;">
                      <p style="margin:0;font-family:%s;font-size:11px;font-weight:900;letter-spacing:3px;color:%s;text-transform:uppercase;">%s</p>
                      <h1 style="margin:10px 0 0 0;font-family:%s;font-size:24px;font-weight:900;color:%s;line-height:30px;">%s</h1>
                      <div style="margin-top:16px;font-family:%s;font-size:14px;line-height:22px;color:%s;">%s</div>
                      %s
                      %s
                    </td></tr>
                    <!-- Pie estilo footer -->
                    <tr><td style="background-color:%s;padding:24px 32px;text-align:center;">
                      <p style="margin:0;font-family:%s;font-size:10px;font-weight:900;letter-spacing:2px;color:#94A3B8;text-transform:uppercase;">&copy; 2026 Real Lisiados F.C. &mdash; Todos los derechos reservados</p>
                      <p style="margin:8px 0 0 0;font-family:%s;font-size:11px;color:#64748B;line-height:17px;">Mucho m&aacute;s que un club. Una familia unida por la pasi&oacute;n.</p>
                      <p style="margin:10px 0 0 0;"><a href="%s" style="font-family:%s;font-size:11px;font-weight:700;color:%s;text-decoration:none;">Abrir la web de RELI &rarr;</a></p>
                    </td></tr>
                  </table>
                  <p style="margin:14px 0 0 0;font-family:%s;font-size:11px;color:%s;">Recibes este correo por ser miembro de Real Lisiados F.C.</p>
                </td></tr>
                </table>
                </body></html>
                """.formatted(
                        escape(title), BG,
                        escape(preheader == null ? "" : preheader), BG, CARD,
                        RED, FONT, FONT, GOLD_LIGHT, GOLD,
                        FONT, RED, escape(kicker == null ? "Real Lisiados F.C." : kicker),
                        FONT, TEXT, escape(title),
                        FONT, TEXT, bodyHtml == null ? "" : bodyHtml,
                        cta, note,
                        DARK, FONT, FONT, frontendUrl, FONT, GOLD_LIGHT,
                        FONT, MUTED);
    }

    /** Tarjeta de detalle (fecha/sede/jornada) estilo card de la web. */
    public String infoCard(String rowsHtml) {
        return """
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%%" style="margin:18px 0;background-color:#F8FAFC;border:1px solid #E2E8F0;border-radius:16px;">
                  <tr><td style="padding:18px 20px;font-family:%s;font-size:13px;line-height:21px;color:%s;">%s</td></tr>
                </table>
                """.formatted(FONT, TEXT, rowsHtml);
    }

    public String matchRow(String label, String value) {
        return "<p style=\"margin:6px 0;\"><span style=\"font-size:10px;font-weight:900;letter-spacing:2px;color:%s;text-transform:uppercase;\">%s</span><br><strong style=\"font-size:15px;color:%s;\">%s</strong></p>"
                .formatted(RED, escape(label), TEXT, value);
    }

    // ---------- Correos concretos ----------

    public String verification(String username, String tokenLink) {
        String body = "<p>Hola <strong>%s</strong>,</p><p>Bienvenido a la familia. Confirma tu direcci&oacute;n de correo para activar tu cuenta y seguir al equipo jornada a jornada.</p>"
                .formatted(escape(username))
                + infoCard(matchRow("Enlace v\u00e1lido durante", "24 horas")
                        + "<p style=\"margin:10px 0 0;font-size:12px;color:" + MUTED + ";\">Si no creaste esta cuenta, ignora este mensaje.</p>");
        return layout("Confirma tu email para activar tu cuenta en RELI.",
                "Verificaci\u00f3n de cuenta", "Confirma tu email, " + username,
                body, "Confirmar email", tokenLink, null);
    }

    public String passwordReset(String resetLink) {
        String body = "<p>Hemos recibido una solicitud para cambiar la contrase&ntilde;a de tu cuenta RELI.</p>"
                + infoCard(matchRow("Enlace v\u00e1lido durante", "1 hora")
                        + "<p style=\"margin:10px 0 0;font-size:12px;color:" + MUTED + ";\">Si no lo solicitaste, ignora este mensaje. Tu contrase&ntilde;a no cambiar&aacute;.</p>");
        return layout("Recupera tu contrase\u00f1a de RELI.",
                "Recuperaci\u00f3n de contrase\u00f1a", "Cambia tu contrase\u00f1a",
                body, "Cambiar contrase\u00f1a", resetLink, null);
    }

    public String testMail() {
        String body = "<p>Si recibes este mensaje, el env&iacute;o de correos (SMTP Gmail) est&aacute; bien configurado.</p>"
                + infoCard(matchRow("Remitente", "Real Lisiados F.C.")
                        + matchRow("Sistema", "Gmail SMTP &bull; smtp.gmail.com:587"));
        return layout("Correo de prueba de RELI.",
                "Panel admin &bull; Prueba SMTP", "Todo listo, el correo funciona",
                body, "Abrir la web", frontendUrl, "Correo enviado desde el panel admin. Solo lo has recibido t\u00fa.");
    }

    /** Envuelve el contenido del aviso de partidos con la plantilla. */
    public String scheduleWrapper(String subject, String innerContentHtml, String ctaText, String ctaUrl, String note) {
        return layout(subject, "Pr\u00f3ximo partido &bull; Real Lisiados", subject, innerContentHtml, ctaText, ctaUrl, note);
    }

    /**
     * Para la vista previa del navegador: sustituye el cid: por el logo en
     * base64 para que se vea sin enviar el correo. En el envío real se sigue
     * usando cid: + adjunto inline.
     */
    public String withPreviewLogo(String html) {
        try (var in = new org.springframework.core.io.ClassPathResource("email/reli-badge-email.png").getInputStream()) {
            String base64 = java.util.Base64.getEncoder().encodeToString(in.readAllBytes());
            return html.replace("cid:reliBadge", "data:image/png;base64," + base64);
        } catch (Exception e) {
            return html;
        }
    }

    private static String escape(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
}
