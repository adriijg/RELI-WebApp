export default function LoadingState({ label = 'Cargando...', className = '' }) {
  return (
    <div className={`p-12 text-center animate-pulse ${className}`}>
      <span className="text-re-rojo font-black uppercase tracking-[0.2em] text-sm">{label}</span>
    </div>
  );
}
