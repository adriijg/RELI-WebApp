import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { confirmPasswordReset, verifyEmail } from '../services/api';

export default function EmailActionPage() {
  const [params] = useSearchParams();
  const [state, setState] = useState({ loading: true, message: '', error: '' });
  const [password, setPassword] = useState('');
  const resetToken = params.get('resetPassword');
  const verifyToken = params.get('verifyEmail');

  useEffect(() => {
    if (resetToken) {
      setState({ loading: false, message: '', error: '' });
      return;
    }
    if (!verifyToken) {
      setState({ loading: false, message: '', error: 'Enlace no válido. Revisa el correo o solicita uno nuevo.' });
      return;
    }
    verifyEmail(verifyToken)
      .then((message) => setState({ loading: false, message: message || 'Email confirmado correctamente.', error: '' }))
      .catch((error) => setState({ loading: false, message: '', error: error.message || 'No se pudo confirmar el email.' }));
  }, [verifyToken, resetToken]);

  const submitReset = async (event) => {
    event.preventDefault();
    setState({ loading: true, message: '', error: '' });
    try {
      const message = await confirmPasswordReset(resetToken, password);
      setState({ loading: false, message: message || 'Contraseña actualizada correctamente.', error: '' });
    } catch (error) {
      setState({ loading: false, message: '', error: error.message || 'No se pudo actualizar la contraseña.' });
    }
  };

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg items-center justify-center p-6">
      <section className="w-full rounded-3xl border border-card-border bg-card-bg p-8 text-center shadow-card">
        <h1 className="mb-4 text-2xl font-black uppercase tracking-tight">Cuenta RELI</h1>
        {resetToken ? (
          <form onSubmit={submitReset} className="space-y-4 text-left">
            <label className="block text-[10px] font-black uppercase tracking-widest">Nueva contraseña
              <input type="password" minLength="8" required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-card-border bg-background px-4 py-3 text-sm font-bold" />
            </label>
            <button disabled={state.loading} className="w-full rounded-xl bg-re-rojo py-3 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50">Cambiar contraseña</button>
          </form>
        ) : state.loading ? (
          <p className="font-bold text-muted-foreground">Validando enlace...</p>
        ) : null}
        {state.message && <p className="mt-4 rounded-xl bg-emerald-500/10 p-3 text-sm font-bold text-emerald-600">{state.message}</p>}
        {state.error && <p className="mt-4 rounded-xl bg-re-rojo/10 p-3 text-sm font-bold text-re-rojo">{state.error}</p>}
        {!state.loading && (
          <Link to="/" className="mt-6 inline-block text-xs font-black uppercase tracking-widest text-re-dorado hover:underline">
            Volver al inicio
          </Link>
        )}
      </section>
    </main>
  );
}