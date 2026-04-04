// src/components/Footer.jsx
import logo from '../assets/reli-badge.png';

export default function Footer() {
    const socialIcons = [
        {
            id: 'x',
            href: '#',
            icon: (
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
            )
        },
        {
            id: 'instagram',
            href: '#',
            icon: (
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
            )
        },
        {
            id: 'tiktok',
            href: '#',
            icon: (
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
                    <path d="M12.525.02c1.31.036 2.512.335 3.6.895l-.01 3.454c-.791-.539-1.727-.872-2.74-.872-.012 0-.024 0-.036.001V7.08c1.026.154 1.833.913 2.146 1.905.15.47.225.96.225 1.465 0 2.8-2.27 5.07-5.07 5.07-2.8 0-5.07-2.27-5.07-5.07 0-2.8 2.27-5.07 5.07-5.07.13 0 .256.004.382.012l.01-3.52c-4.73.184-8.525 4.093-8.525 8.908 0 4.97 4.03 9 9 9s9-4.03 9-9c0-.13-.004-.256-.012-.382l.01-.01C20.525 4.417 24 3.02 24 0h-3.475c0 .01-.004.02-.005.03-.004 2.115-1.716 3.827-3.827 3.827V.02h-4.168z" />
                </svg>
            )
        },
        {
            id: 'facebook',
            href: '#',
            icon: (
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
            )
        }
    ];

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
                        <div className="flex gap-4">
                            {socialIcons.map(social => (
                                <a
                                    key={social.id}
                                    href={social.href}
                                    className="w-10 h-10 rounded-full border border-card-border flex items-center justify-center hover:bg-re-rojo hover:text-white transition-all text-muted-foreground hover:border-re-rojo"
                                    aria-label={`Seguir en ${social.id}`}
                                >
                                    {social.icon}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Columna 2: Navegación Rápida */}
                    <div className="flex flex-col gap-6">
                        <h4 className="text-re-rojo font-black uppercase tracking-widest text-xs">Club</h4>
                        <ul className="flex flex-col gap-4 text-sm font-bold">
                            {['Historia', 'Palmarés', 'Instalaciones', 'Transparencia', 'Contacto'].map(item => (
                                <li key={item}><a href="#" className="hover:text-re-rojo transition-colors">{item}</a></li>
                            ))}
                        </ul>
                    </div>

                    {/* Columna 3: Competición */}
                    <div className="flex flex-col gap-6">
                        <h4 className="text-re-rojo font-black uppercase tracking-widest text-xs">Competición</h4>
                        <ul className="flex flex-col gap-4 text-sm font-bold">
                            {['Primer Equipo', 'Resultados', 'Clasificación', 'Cantera', 'Femenino'].map(item => (
                                <li key={item}><a href="#" className="hover:text-re-rojo transition-colors">{item}</a></li>
                            ))}
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
                        <a href="#" className="hover:text-foreground transition-colors">Política de Privacidad</a>
                        <a href="#" className="hover:text-foreground transition-colors">Aviso Legal</a>
                        <a href="#" className="hover:text-foreground transition-colors">Cookies</a>
                    </div>
                </div>

            </div>
        </footer>
    );
}
