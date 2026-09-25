import { useEffect, useState } from 'react';
import PageHeader from '../../components/admin/PageHeader';
import {
  getCompetitions,
  getEmailStatus,
  sendNextMatchTestEmail,
  sendTestEmail,
  toPage,
} from '../../services/api';

function StatusRow({ label, ok, value }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-card-border last:border-0">
      <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2 text-sm font-bold">
        <span className={`inline-block w-2.5 h-2.5 rounded-full ${ok ? 'bg-emerald-500' : 'bg-re-rojo'}`} />
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
  const [competitionId, setCompetitionId] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    getEmailStatus().then(setStatus).catch(() => setStatus(null));
    getCompetitions({ size: 100 })
      .then((data) => {
        const list = toPage(data).content;
        setCompetitions(list);
        if (list.length > 0) setCompetitionId(String(list[0].id));
      })
      .catch(() => setCompetitions([]));
  }, []);

  const handleTest = async (event) => {
    event.preventDefault();
    setSending(true);
    setMessage('');
    setError('');
    try {
      setMessage(await sendTestEmail(testTo));
    } catch (err) {
      setError(err.message || 'No se pudo enviar el correo de prueba');
    } finally {
      setSending(false);
    }
  };

  const handleNextMatch = async (event) => {
    event.preventDefault();
    setSending(true);
    setMessage('');
    setError('');
    try {
      setMessage(await sendNextMatchTestEmail(competitionId, nextTo));
    } catch (err) {
      setError(err.message || 'No se pudo enviar el aviso de prueba');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Correos"
        subtitle="Estado de Resend y envío de correos de prueba sin molestar a los usuarios."
      />

      {(message || error) && (
        <div className={`mb-6 rounded-2xl px-5 py-4 text-sm font-bold border ${error ? 'bg-re-rojo/10 border-re-rojo/30 text-re-rojo' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'}`}>
          {error || message}
        </div>
      )}

      <section className="bg-card-bg border border-card-border rounded-3xl shadow-card p-6 lg:p-8 mb-6">
        <h2 className="text-sm font-black uppercase tracking-widest mb-2">Estado de la configuración</h2>
        {!status ? (
          <p className="text-sm font-bold text-muted-foreground">Cargando estado...</p>
        ) : (
          <div>
            <StatusRow label="Envío activado" ok={status.enabled} value={status.enabled ? 'Sí' : 'No (EMAIL_ENABLED=false)'} />
            <StatusRow label="API Key" ok={status.apiKeyConfigured} value={status.apiKeyConfigured ? 'Configurada' : 'Falta RESEND_API_KEY'} />
            <StatusRow label="Remitente" ok={status.fromConfigured} value={status.from || 'Falta RESEND_FROM'} />
            <div className="flex items-center justify-between gap-4 py-3">
              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">URL frontend</span>
              <span className="text-sm font-bold break-all text-right">{status.frontendUrl || '—'}</span>
            </div>
          </div>
        )}
        <p className="mt-4 text-xs font-bold text-muted-foreground">
          El remitente debe ser de un dominio verificado en Resend. Sin verificar, Resend solo deja enviar a tu propio correo de registro.
        </p>
      </section>

      <section className="bg-card-bg border border-card-border rounded-3xl shadow-card p-6 lg:p-8 mb-6">
        <h2 className="text-sm font-black uppercase tracking-widest mb-2">Correo de prueba</h2>
        <p className="text-xs font-bold text-muted-foreground mb-4">Comprueba que Resend envía correctamente a una dirección concreta.</p>
        <form onSubmit={handleTest} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            required
            value={testTo}
            onChange={(e) => setTestTo(e.target.value)}
            placeholder="destino@ejemplo.com"
            className="flex-1 bg-muted/10 border border-card-border rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-re-rojo"
          />
          <button
            type="submit"
            disabled={sending}
            className="bg-re-rojo hover:bg-re-rojo/90 text-white font-black px-6 py-3 rounded-xl text-xs tracking-widest uppercase transition-all disabled:opacity-50"
          >
            {sending ? 'Enviando...' : 'Enviar prueba'}
          </button>
        </form>
      </section>

      <section className="bg-card-bg border border-card-border rounded-3xl shadow-card p-6 lg:p-8">
        <h2 className="text-sm font-black uppercase tracking-widest mb-2">Probar aviso de próximo partido</h2>
        <p className="text-xs font-bold text-muted-foreground mb-4">
          Envía a una sola dirección el mismo correo que recibirían todos los usuarios tras el scraping, sin lanzar sincronización.
        </p>
        <form onSubmit={handleNextMatch} className="flex flex-col sm:flex-row gap-3">
          <select
            value={competitionId}
            onChange={(e) => setCompetitionId(e.target.value)}
            className="sm:max-w-xs bg-muted/10 border border-card-border rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-re-rojo"
          >
            {competitions.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input
            type="email"
            required
            value={nextTo}
            onChange={(e) => setNextTo(e.target.value)}
            placeholder="destino@ejemplo.com"
            className="flex-1 bg-muted/10 border border-card-border rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-re-rojo"
          />
          <button
            type="submit"
            disabled={sending || !competitionId}
            className="bg-re-rojo hover:bg-re-rojo/90 text-white font-black px-6 py-3 rounded-xl text-xs tracking-widest uppercase transition-all disabled:opacity-50"
          >
            {sending ? 'Enviando...' : 'Enviar aviso'}
          </button>
        </form>
      </section>
    </div>
  );
}
