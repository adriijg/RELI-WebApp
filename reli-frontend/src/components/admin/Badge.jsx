const VARIANTS = {
  red: 'bg-re-rojo/10 text-re-rojo border-re-rojo/20',
  gold: 'bg-re-dorado/15 text-re-dorado border-re-dorado/25',
  green: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/25',
  yellow: 'bg-yellow-500/15 text-yellow-600 border-yellow-500/25',
  blue: 'bg-sky-500/15 text-sky-600 border-sky-500/25',
  slate: 'bg-muted/20 text-muted-foreground border-card-border',
};

export default function Badge({ children, variant = 'slate', className = '' }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${VARIANTS[variant] || VARIANTS.slate} ${className}`}
    >
      {children}
    </span>
  );
}
