// src/components/NewsSection.jsx
export default function NewsSection() {
  return (
    <section className="py-12">
      {/* Cabecera Responsiva */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b border-card-border pb-4 gap-4 transition-all">
        <div className="max-w-xl">
          <h2 className="text-3xl lg:text-5xl font-black italic tracking-tighter uppercase leading-none">Últimas Noticias</h2>
          <p className="text-muted-foreground mt-3 font-medium text-xs lg:text-sm">Toda la actualidad del primer equipo y la cantera directamente desde el vestuario.</p>
        </div>
        <button className="text-re-rojo font-black text-xs lg:text-sm hover:underline flex items-center gap-2 group transition-all">
          VER TODAS <span className="group-hover:translate-x-1 transition-transform">→</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* NOTICIA PRINCIPAL (Izquierda) */}
        <div className="relative group cursor-pointer overflow-hidden rounded-3xl bg-slate-900 aspect-[4/5] lg:aspect-auto card-depth min-h-[400px]">
          <img 
            src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2076&auto=format&fit=crop" 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70"
            alt="Capitán"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-re-azul-oscuro via-transparent to-transparent"></div>
          <div className="absolute bottom-0 p-6 lg:p-10">
            <span className="bg-re-dorado text-re-azul-oscuro text-[9px] lg:text-[10px] font-black px-3 py-1 rounded mb-4 inline-block uppercase tracking-widest">Entrevista</span>
            <h3 className="text-2xl lg:text-4xl font-black leading-tight mb-4 group-hover:text-re-dorado transition-colors">
              "ESTE CLUB ES MI FAMILIA", AFIRMA EL CAPITÁN
            </h3>
            <p className="text-gray-300 text-xs lg:text-sm line-clamp-2 max-w-md">
              Hablamos con nuestro líder sobre los objetivos de la temporada y su renovación hasta 2027.
            </p>
          </div>
        </div>

        {/* NOTICIAS SECUNDARIAS (Derecha) */}
        <div className="flex flex-col gap-6">
          
          {/* Noticia 2 */}
          <div className="bg-card-bg border border-card-border rounded-3xl overflow-hidden flex h-auto lg:h-1/2 group cursor-pointer transition-all hover:bg-muted/5 shadow-lg">
            <div className="w-1/3 overflow-hidden min-h-[150px]">
              <img src="https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?q=80&w=2070&auto=format&fit=crop" className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="p-4 lg:p-8 flex flex-col justify-center w-2/3">
              <span className="text-re-rojo text-[9px] lg:text-[10px] font-black uppercase tracking-widest mb-2">Entrenamiento</span>
              <h4 className="text-sm lg:text-xl font-black leading-tight uppercase transition-colors group-hover:text-re-rojo">SESIÓN TÁCTICA ANTES DEL GRAN DERBI DEL SÁBADO</h4>
              <p className="text-[9px] lg:text-xs text-muted-foreground mt-2 font-bold tracking-widest">🕒 HOY • 10:30 AM</p>
            </div>
          </div>

          {/* Noticia 3 (Banner Academia) */}
          <div className="bg-re-rojo rounded-3xl p-6 lg:p-10 flex flex-col justify-center relative overflow-hidden group cursor-pointer shadow-xl transition-all hover:scale-[1.01] active:scale-95">
             {/* Icono de fondo decorativo */}
            <span className="absolute -right-6 lg:-right-10 -bottom-6 lg:-bottom-10 text-8xl lg:text-[180px] opacity-10 font-black italic select-none">RELI</span>
            
            <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest mb-2 text-white/80">Academia</span>
            <h4 className="text-xl lg:text-3xl font-black text-white leading-none mb-4 lg:mb-6 uppercase">INSCRIPCIONES ABIERTAS PARA EL CAMPUS DE VERANO</h4>
            <button className="flex items-center gap-2 text-white font-bold text-xs lg:text-sm group-hover:translate-x-2 transition-transform">
              INSCRIBIRSE <span>→</span>
            </button>
          </div>

        </div>
      </div>
    </section>
  )
}