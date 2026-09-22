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
    <div className={`card-depth rounded-3xl p-5 border bg-gradient-to-br ${accents[accent]} transition-all hover:-translate-y-1 hover:shadow-xl`}>
      <p className="text-4xl font-black italic tracking-tighter leading-none">{value ?? '—'}</p>
      <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
      {hint && <p className="mt-1 text-[10px] font-bold text-muted-foreground/70">{hint}</p>}
    </div>
  );
}
