import { useEffect, useState } from 'react';
import PageHeader from '../../components/admin/PageHeader';
import AdminSelect from '../../components/admin/AdminSelect';
import Badge from '../../components/admin/Badge';
import {
  getCompetitions,
  getEmailStatus,
  fetchEmailPreviewHtml,
  sendNextMatchTestEmail,
  sendTestEmail,
  resendMatchNotice,
  resendVerificationEmail,
  getMatchesByCompetition,
  toPage,
} from '../../services/api';

const PREVIEW_TABS = [
  { id: 'test', label: 'Prueba' },
  { id: 'verify', label: 'Verificación' },
  { id: 'reset', label: 'Contraseña' },
  { id: 'match', label: 'Próximo partido' },
];

const INPUT_CLASS =
  'w-full bg-muted/30 border border-card-border rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-re-rojo/40 transition-all';

function Section({ title, description, children }) {
  return (
    <section className="bg-card-bg border border-card-border rounded-3xl shadow-card p-6 lg:p-8">
      <h2 className="text-sm font-black uppercase tracking-widest mb-2">{title}</h2>
      {description && <p className="text-xs font-bold text-muted-foreground mb-4">{description}</p>}
      {children}
    </section>
  );
}

function StatusRow({ label, ok, value }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-card-border last:border-0">
      <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2 text-sm font-bold text-right">
        <span className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${ok ? 'bg-emerald-500' : 'bg-re-rojo'}`} />
        {value}
      </span>
    </div>
  );
}

export default function EmailsAdmin() {
  const [status, setStatus] = useState(null);
  const [competitions, setCompetitions] = useState([]);
  const [testTo, setTestTo] = useState('');
  const [nextTo, setNextTo] = useState('');
  const [verifyTo, setVerifyTo] = useState('');
  const [competitionId, setCompetitionId] = useState('');
  const [matches, setMatches] = useState([]);
  const [matchId, setMatchId] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [previewType, setPreviewType] = useState('test');
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    getEmailStatus().then(setStatus).catch(() => setStatus(null));
    getCompetitions({ size: 200 })
      .then((data) => {
        const list = toPage(data).content;
        setCompetitions(list);
        if (list.length > 0) setCompetitionId(String(list[0].id));
      })
      .catch(() => setCompetitions([]));
  }, []);

  const send = async (action, successFallback) => {
    setSending(true);
    setMessage('');
    setError('');
    try {
      setMessage(await action());
    } catch (err) {
      setError(err.message || successFallback);
    } finally {
      setSending(false);
    }
  };

  const handleTest = (event) => {
    event.preventDefault();
    send(() => sendTestEmail(testTo), 'No se pudo enviar el correo de prueba');
  };

  const handleNextMatch = (event) => {
    event.preventDefault();
    send(() => sendNextMatchTestEmail(competitionId, nextTo), 'No se pudo enviar el aviso de prueba');
  };

  const handleResendVerification = (event) => {
    event.preventDefault();
    send(() => resendVerificationEmail(verifyTo), 'No se pudo reenviar la verificación');
  };

  const handleResendMatch = (event) => {
    event.preventDefault();
    send(() => resendMatchNotice(matchId), 'No se pudo reenviar el aviso de horario');
  };

  useEffect(() => {
    if (!competitionId) {
      setMatches([]);
      setMatchId('');
      return;
    }
    let cancelled = false;
    getMatchesByCompetition(competitionId)
      .then((data) => {
        if (cancelled) return;
        const list = (Array.isArray(data) ? data : []).filter(
          (match) => match.status === 'SCHEDULED',
        );
        setMatches(list);
        setMatchId(list.length ? String(list[0].id) : '');
      })
      .catch(() => {
        if (!cancelled) setMatches([]);
      });
    return () => {
      cancelled = true;
    };
  }, [competitionId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPreviewLoading(true);
      try {
        const html = await fetchEmailPreviewHtml(previewType, competitionId);
        if (!cancelled) setPreviewHtml(html);
      } catch {
        if (!cancelled) setPreviewHtml('');
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [previewType, competitionId]);

  return (
    <div>
      <PageHeader
        title="Correos"
        subtitle="Estado del SMTP y envío de correos de prueba sin molestar a los usuarios."
      />

      {(message || error) && (
        <div
          className={`mb-6 rounded-2xl px-5 py-4 text-sm font-bold border ${
            error ? 'bg-re-rojo/10 border-re-rojo/30 text-re-rojo' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
          }`}
        >
          {error || message}
        </div>
      )}

      <div className="space-y-6">
        <Section title="Estado de la configuración">
          {!status ? (
            <p className="text-sm font-bold text-muted-foreground">Cargando estado...</p>
          ) : (
            <div>
              <StatusRow label="Envío activado" ok={status.enabled} value={status.enabled ? 'Sí' : 'No (EMAIL_ENABLED=false)'} />
              <StatusRow
                label="SMTP Gmail"
                ok={status.smtpConfigured}
                value={status.smtpConfigured ? 'Configurado' : 'Falta GMAIL_USER / GMAIL_PASSWORD'}
              />
              <StatusRow label="Remitente" ok={status.fromConfigured} value={status.from || 'Falta GMAIL_USER'} />
              <div className="flex items-center justify-between gap-4 py-3">
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">URL frontend</span>
                <span className="text-sm font-bold break-all text-right">{status.frontendUrl || '—'}</span>
              </div>
            </div>
          )}
          <p className="mt-4 text-xs font-bold text-muted-foreground">
            El envío usa Gmail SMTP (smtp.gmail.com:587) con una contraseña de aplicación de 16 letras (no la contraseña normal de Gmail).
          </p>
        </Section>

        <Section
          title="Correo de prueba"
          description="Comprueba que el SMTP envía correctamente a una dirección concreta."
        >
          <form onSubmit={handleTest} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              required
              value={testTo}
              onChange={(event) => setTestTo(event.target.value)}
              placeholder="destino@ejemplo.com"
              className={`flex-1 ${INPUT_CLASS}`}
            />
            <button
              type="submit"
              disabled={sending}
              className="bg-re-rojo hover:bg-re-rojo/90 text-white font-black px-6 py-3 rounded-xl text-xs tracking-widest uppercase transition-all disabled:opacity-50"
            >
              {sending ? 'Enviando...' : 'Enviar prueba'}
            </button>
          </form>
        </Section>

        <Section
          title="Probar aviso de próximo partido"
          description="Envía a una sola dirección el mismo correo que recibirían todos los usuarios tras el scraping, sin lanzar sincronización."
        >
          <form onSubmit={handleNextMatch} className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <AdminSelect
              label="Competición"
              value={competitionId}
              onChange={setCompetitionId}
              options={competitions.map((competition) => ({ value: String(competition.id), label: competition.name }))}
              className="sm:max-w-xs sm:flex-1"
            />
            <input
              type="email"
              required
              value={nextTo}
              onChange={(event) => setNextTo(event.target.value)}
              placeholder="destino@ejemplo.com"
              className={`sm:flex-1 ${INPUT_CLASS}`}
            />
            <button
              type="submit"
              disabled={sending || !competitionId}
              className="bg-re-rojo hover:bg-re-rojo/90 text-white font-black px-6 py-3 rounded-xl text-xs tracking-widest uppercase transition-all disabled:opacity-50"
            >
              {sending ? 'Enviando...' : 'Enviar aviso'}
            </button>
          </form>
        </Section>

        <Section
          title="Reenviar verificación de cuenta"
          description="Reenvía el correo de confirmación a un usuario que aún no lo ha verificado (por si el automático falló)."
        >
          <form onSubmit={handleResendVerification} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              required
              value={verifyTo}
              onChange={(event) => setVerifyTo(event.target.value)}
              placeholder="usuario@ejemplo.com"
              className={`flex-1 ${INPUT_CLASS}`}
            />
            <button
              type="submit"
              disabled={sending}
              className="bg-re-rojo hover:bg-re-rojo/90 text-white font-black px-6 py-3 rounded-xl text-xs tracking-widest uppercase transition-all disabled:opacity-50"
            >
              {sending ? 'Enviando...' : 'Reenviar verificación'}
            </button>
          </form>
        </Section>

        <Section
          title="Reenviar aviso de horario"
          description="Reenvía a todos los usuarios verificados el aviso del horario confirmado de un partido (por si el automático falló)."
        >
          <form onSubmit={handleResendMatch} className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <AdminSelect
              label="Competición"
              value={competitionId}
              onChange={setCompetitionId}
              options={competitions.map((competition) => ({ value: String(competition.id), label: competition.name }))}
              className="sm:max-w-xs sm:flex-1"
            />
            <AdminSelect
              label="Partido"
              value={matchId}
              onChange={setMatchId}
              placeholder={matches.length ? 'Selecciona…' : 'Sin partidos programados'}
              options={matches.map((match) => ({
                value: String(match.id),
                label: `J${match.jornada ?? '—'} · ${match.rival}${match.date ? ` · ${new Date(match.date).toLocaleDateString('es-ES')}` : ''}`,
              }))}
              className="sm:flex-1"
            />
            <button
              type="submit"
              disabled={sending || !matchId}
              className="bg-re-rojo hover:bg-re-rojo/90 text-white font-black px-6 py-3 rounded-xl text-xs tracking-widest uppercase transition-all disabled:opacity-50"
            >
              {sending ? 'Enviando...' : 'Reenviar aviso'}
            </button>
          </form>
        </Section>

        <Section
          title="Vista previa de la plantilla"
          description="Así se ve el correo en Gmail / Outlook (cabecera roja como el Navbar, tarjeta blanca y pie oscuro). No se envía nada."
        >
          <div className="flex flex-wrap gap-2 mb-4">
            {PREVIEW_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPreviewType(tab.id)}
                className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all ${
                  previewType === tab.id
                    ? 'bg-re-rojo text-white border-re-rojo'
                    : 'bg-muted/10 text-muted-foreground border-card-border hover:border-re-rojo'
                }`}
              >
                {tab.label}
              </button>
            ))}
            {previewLoading && <Badge variant="slate">Cargando…</Badge>}
          </div>
          <div className="rounded-2xl overflow-hidden border border-card-border bg-[#F1F5F9]">
            {previewLoading && !previewHtml ? (
              <p className="p-8 text-sm font-bold text-muted-foreground text-center">Cargando vista previa...</p>
            ) : previewHtml ? (
              <iframe
                title="Vista previa del correo"
                srcDoc={previewHtml}
                className="w-full h-[70vh] min-h-[420px] max-h-[820px] bg-white"
                style={{ border: 0 }}
                sandbox=""
              />
            ) : (
              <p className="p-8 text-sm font-bold text-muted-foreground text-center">Inicia el backend para ver la plantilla.</p>
            )}
          </div>
        </Section>
      </div>
    </div>
  );
}
