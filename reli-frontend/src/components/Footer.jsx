import { useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/reli-badge.png';
import ContactModal from './ContactModal';

const CONTACT_EMAIL = 'reallisiados.info@gmail.com';
const FFM_URL =
    'https://parla.ffmadrid.es/nfg/NPcd/NFG_VisEquipos?cod_primaria=1000128&Codigo_Equipo=320143';

const CLUB_LINKS = [
    { label: 'Historia', to: '/historia' },
    { label: 'Primer equipo', to: '/jugadores' },
    { label: 'Quinteto ideal', to: '/quinteto' },
    { label: 'Noticias', to: '/noticias' },
];

const COMPETITION_LINKS = [
    { label: 'Clasificación', to: '/competicion' },
    { label: 'Calendario', to: '/calendario' },
];

export default function Footer() {
    const year = new Date().getFullYear();
    const [contactOpen, setContactOpen] = useState(false);
    const openContact = () => setContactOpen(true);

    return (
        <>
        <footer className="mt-20 overflow-hidden border-t border-card-border bg-card-bg">
            <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
                <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr] lg:gap-12">

                    <div className="flex flex-col gap-5">
                        <Link to="/" className="flex w-fit items-center gap-3 transition-transform hover:scale-[1.02]">
                            <img src={logo} alt="Real Lisiados F.C." className="h-16 w-auto" />
                            <div className="flex flex-col font-black italic tracking-tighter text-foreground">
                                <span className="text-xl leading-none">REAL LISIADOS</span>
                                <span className="mt-1 text-sm leading-none text-re-rojo">EST. 2018</span>
                            </div>
                        </Link>
                        <p className="max-w-xs text-sm font-medium leading-relaxed text-muted-foreground">
                            Fútbol sala de barrio en Parla. Una familia unida por la pasión, el esfuerzo y la superación en cada partido.
                        </p>
                        <button
                            type="button"
                            onClick={openContact}
                            className="inline-flex w-fit items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-re-rojo"
                        >
                            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <rect x="2" y="4" width="20" height="16" rx="2" />
                                <path d="m22 7-10 6L2 7" />
                            </svg>
                            {CONTACT_EMAIL}
                        </button>
                    </div>

                    <div className="flex flex-col gap-5">
                        <h2 className="text-xs font-black uppercase tracking-widest text-re-rojo">Club</h2>
                        <ul className="flex flex-col gap-3 text-sm font-bold">
                            {CLUB_LINKS.map((link) => (
                                <li key={link.to}>
                                    <Link to={link.to} className="transition-colors hover:text-re-rojo">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex flex-col gap-5">
                        <h2 className="text-xs font-black uppercase tracking-widest text-re-rojo">Competición</h2>
                        <ul className="flex flex-col gap-3 text-sm font-bold">
                            {COMPETITION_LINKS.map((link) => (
                                <li key={link.to}>
                                    <Link to={link.to} className="transition-colors hover:text-re-rojo">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                            <li>
                                <a
                                    href={FFM_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 transition-colors hover:text-re-rojo"
                                >
                                    Ficha oficial FFM
                                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <path d="M7 17 17 7M9 7h8v8" />
                                    </svg>
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div className="flex flex-col gap-5">
                        <h2 className="text-xs font-black uppercase tracking-widest text-re-rojo">Contacto</h2>
                        <div className="rounded-2xl border border-card-border bg-muted/5 p-5">
                            <p className="text-sm font-black uppercase tracking-tight text-foreground">
                                ¿Quieres jugar con nosotros?
                            </p>
                            <p className="mt-2 text-xs font-bold leading-relaxed text-muted-foreground">
                                Si te apetece entrenar, colaborar o patrocinar al equipo, escríbenos. Toda ayuda suma.
                            </p>
                            <button
                                type="button"
                                onClick={openContact}
                                className="mt-4 inline-flex items-center gap-2 rounded-full bg-re-rojo px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-re-rojo/90"
                            >
                                Escríbenos
                            </button>
                        </div>
                    </div>

                </div>

                <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-card-border pt-6 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground md:flex-row md:text-left">
                    <p>© {year} Real Lisiados F.C. · Parla</p>
                    <div className="flex gap-6">
                        <button type="button" onClick={openContact} className="transition-colors hover:text-foreground">Contacto</button>
                        <a href={FFM_URL} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-foreground">Federación</a>
                    </div>
                </div>

            </div>
        </footer>

        {contactOpen && <ContactModal onClose={() => setContactOpen(false)} />}
        </>
    );
}
