export default function StatCard({ label, value, accent = 'red', hint }) {
  const accents = {
    red: 'from-re-rojo/20 to-transparent border-re-rojo/30 text-re-rojo',
    gold: 'from-re-dorado/20 to-transparent border-re-dorado/40 text-re-dorado',
    blue: 'from-sky-500/20 to-transparent border-sky-500/30 text-sky-500',
    green: 'from-emerald-500/20 to-transparent border-emerald-500/30 text-emerald-500',
    purple: 'from-violet-500/20 to-transparent border-violet-500/30 text-violet-500',
    orange: 'from-orange-500/20 to-transparent border-orange-500/30 text-orange-500',
    slate: 'from-slate-500/20 to-transparent border-slate-500/30 text-slate-500',
  };

  return (
    <div className={`card-depth rounded-2xl lg:rounded-2xl p-3 lg:p-4 border bg-gradient-to-br ${accents[accent]} transition-all hover:-translate-y-0.5 hover:shadow-lg h-full min-h-[130px] lg:min-h-[150px] flex flex-col justify-center`}>
      <p className="text-2xl lg:text-3xl font-black italic tracking-tighter leading-none">{value ?? '—'}</p>
      <p className="mt-2 text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      {hint && <p className="mt-1 text-[9px] font-bold text-muted-foreground/70">{hint}</p>}
    </div>
  );
}
