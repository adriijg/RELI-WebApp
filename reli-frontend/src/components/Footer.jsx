// src/components/Footer.jsx
import { Link } from 'react-router-dom';
import logo from '../assets/reli-badge.png';

const CONTACT_EMAIL = 'reallisiados.info@gmail.com';
const FFM_URL =
    'https://parla.ffmadrid.es/nfg/NPcd/NFG_VisEquipos?cod_primaria=1000102&Codigo_Equipo=320143';

export default function Footer() {
    return (
        <footer className="mt-20 bg-card-bg border-t border-card-border overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 py-16">

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

                    {/* Columna 1: Brand & Slogan */}
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center gap-3">
                            <img src={logo} alt="Real Lisiados F.C." className="h-16 w-auto" />
                            <div className="flex flex-col font-black italic tracking-tighter text-foreground">
                                <span className="text-xl leading-none">REAL LISIADOS</span>
                                <span className="text-re-rojo text-sm">EST. 2018</span>
                            </div>
                        </div>
                        <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                            Mucho más que un club de fútbol. Una familia unida por la pasión, el esfuerzo y la superación en cada encuentro.
                        </p>
                        <a
                            href={`mailto:${CONTACT_EMAIL}`}
                            className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-re-rojo transition-colors"
                        >
                            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <rect x="2" y="4" width="20" height="16" rx="2" />
                                <path d="m22 7-10 6L2 7" />
                            </svg>
                            {CONTACT_EMAIL}
                        </a>
                    </div>

                    {/* Columna 2: Navegación Rápida */}
                    <div className="flex flex-col gap-6">
                        <h4 className="text-re-rojo font-black uppercase tracking-widest text-xs">Club</h4>
                        <ul className="flex flex-col gap-4 text-sm font-bold">
                            <li><Link to="/historia" className="hover:text-re-rojo transition-colors">Historia</Link></li>
                            <li><Link to="/jugadores" className="hover:text-re-rojo transition-colors">Palmarés</Link></li>
                            <li><Link to="/" className="hover:text-re-rojo transition-colors">Instalaciones</Link></li>
                            <li><Link to="/" className="hover:text-re-rojo transition-colors">Transparencia</Link></li>
                            <li><a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-re-rojo transition-colors">Contacto</a></li>
                        </ul>
                    </div>

                    {/* Columna 3: Competición */}
                    <div className="flex flex-col gap-6">
                        <h4 className="text-re-rojo font-black uppercase tracking-widest text-xs">Competición</h4>
                        <ul className="flex flex-col gap-4 text-sm font-bold">
                            <li><Link to="/competicion" className="hover:text-re-rojo transition-colors">Clasificación</Link></li>
                            <li><Link to="/jugadores" className="hover:text-re-rojo transition-colors">Primer Equipo</Link></li>
                            <li><Link to="/competicion" className="hover:text-re-rojo transition-colors">Resultados</Link></li>
                            <li>
                                <a
                                    href={FFM_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-re-rojo transition-colors"
                                >
                                    Ficha oficial FFM
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Columna 4: Newsletter */}
                    <div className="flex flex-col gap-6">
                        <h4 className="text-re-rojo font-black uppercase tracking-widest text-xs">Newsletter</h4>
                        <p className="text-muted-foreground text-xs font-bold leading-relaxed">
                            Apúntate para recibir las últimas noticias y ofertas exclusivas de la tienda oficial.
                        </p>
                        <div className="relative group">
                            <input
                                type="email"
                                placeholder="tu@email.com"
                                className="w-full bg-muted/5 border border-card-border py-4 px-6 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-re-rojo/50 transition-all text-foreground"
                            />
                            <button className="absolute right-2 top-2 bottom-2 bg-re-rojo text-white px-6 rounded-xl font-black text-[10px] tracking-widest hover:bg-re-rojo/90 transition-all">
                                UNIRSE
                            </button>
                        </div>
                    </div>

                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-card-border flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-black text-muted-foreground tracking-widest uppercase text-center md:text-left">
                    <p>© 2026 REAL LISIADOS F.C. TODOS LOS DERECHOS RESERVADOS.</p>
                    <div className="flex gap-8">
                        <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-foreground transition-colors">Contacto</a>
                        <a href={FFM_URL} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Federación</a>
                    </div>
                </div>

            </div>
        </footer>
    );
}
