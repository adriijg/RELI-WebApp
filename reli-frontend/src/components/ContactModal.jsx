import { useEffect, useRef, useState } from 'react';
import { sendContactMessage } from '../services/api';

const CONTACT_EMAIL = 'reallisiados.info@gmail.com';

const INPUT_CLASS =
    'w-full rounded-xl border border-white/10 bg-muted/50 px-4 py-3 text-sm font-bold text-foreground transition-all placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-re-rojo/50';

export default function ContactModal({ onClose }) {
    const [form, setForm] = useState({ name: '', email: '', message: '', website: '' });
    const [status, setStatus] = useState('idle');
    const [error, setError] = useState('');
    const nameRef = useRef(null);

    useEffect(() => {
        const onKey = (event) => {
            if (event.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        nameRef.current?.focus();
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = previousOverflow;
        };
    }, [onClose]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((previous) => ({ ...previous, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (status === 'sending') return;
        setStatus('sending');
        setError('');
        try {
            await sendContactMessage({
                name: form.name.trim(),
                email: form.email.trim(),
                message: form.message.trim(),
                website: form.website,
            });
            setStatus('sent');
        } catch (err) {
            setError(err?.message || 'No se pudo enviar el mensaje. Inténtalo de nuevo.');
            setStatus('error');
        }
    };

    return (
        <div
            className="fixed inset-0 z-[120] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-title"
        >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-card-border bg-background shadow-2xl">
                <div className="relative overflow-hidden bg-re-rojo px-6 py-6 text-white">
                    <span className="pointer-events-none absolute -right-3 -top-4 text-6xl font-black italic text-white/10 select-none">
                        RELI
                    </span>
                    <p className="relative text-[10px] font-black uppercase tracking-[0.25em] text-white/75">
                        Real Lisiados F.C.
                    </p>
                    <h2 id="contact-title" className="relative mt-1 text-2xl font-black tracking-tighter">
                        HABLEMOS
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Cerrar"
                        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                    >
                        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                            <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {status === 'sent' ? (
                    <div className="px-6 py-10 text-center sm:px-8">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                            <svg viewBox="0 0 24 24" className="h-7 w-7 fill-none stroke-current" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="m5 13 4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="mt-4 text-xl font-black tracking-tight text-foreground">Mensaje enviado</h3>
                        <p className="mx-auto mt-2 max-w-sm text-sm font-medium leading-relaxed text-muted-foreground">
                            Gracias{form.name ? `, ${form.name.trim()}` : ''}. Te responderemos a{' '}
                            <span className="font-bold text-foreground">{form.email.trim()}</span> lo antes posible.
                        </p>
                        <button
                            type="button"
                            onClick={onClose}
                            className="mt-6 rounded-full bg-re-rojo px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-re-rojo/90"
                        >
                            Cerrar
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6 sm:px-8">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor="contact-name" className="mb-2 block text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    Nombre
                                </label>
                                <input
                                    ref={nameRef}
                                    id="contact-name"
                                    type="text"
                                    name="name"
                                    autoComplete="name"
                                    required
                                    maxLength={80}
                                    value={form.name}
                                    onChange={handleChange}
                                    className={INPUT_CLASS}
                                    placeholder="Tu nombre"
                                />
                            </div>
                            <div>
                                <label htmlFor="contact-email" className="mb-2 block text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    Email
                                </label>
                                <input
                                    id="contact-email"
                                    type="email"
                                    name="email"
                                    autoComplete="email"
                                    required
                                    maxLength={160}
                                    value={form.email}
                                    onChange={handleChange}
                                    className={INPUT_CLASS}
                                    placeholder="tu@ejemplo.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="contact-message" className="mb-2 block text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                Mensaje
                            </label>
                            <textarea
                                id="contact-message"
                                name="message"
                                required
                                minLength={10}
                                maxLength={2000}
                                rows={5}
                                value={form.message}
                                onChange={handleChange}
                                className={`${INPUT_CLASS} resize-none`}
                                placeholder="Cuéntanos qué necesitas: jugar, colaborar, patrocinar..."
                            />
                            <p className="mt-1.5 text-right text-[10px] font-bold text-muted-foreground/70">
                                {form.message.length}/2000
                            </p>
                        </div>

                        <div className="hidden" aria-hidden="true">
                            <label htmlFor="contact-website">No rellenar</label>
                            <input
                                id="contact-website"
                                type="text"
                                name="website"
                                tabIndex={-1}
                                autoComplete="off"
                                value={form.website}
                                onChange={handleChange}
                            />
                        </div>

                        {error && (
                            <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-center text-[11px] font-bold text-red-500">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={status === 'sending'}
                            className="w-full rounded-xl bg-re-rojo px-4 py-3.5 text-[11px] font-black uppercase tracking-widest text-white transition-colors hover:bg-re-rojo/90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {status === 'sending' ? 'Enviando...' : 'Enviar mensaje'}
                        </button>

                        <p className="text-center text-[10px] font-bold leading-relaxed text-muted-foreground">
                            ¿Prefieres el correo de siempre?{' '}
                            <a href={`mailto:${CONTACT_EMAIL}`} className="font-black text-foreground underline decoration-re-rojo/50 underline-offset-2 hover:text-re-rojo">
                                {CONTACT_EMAIL}
                            </a>
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
}
