import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

/**
 * Atajo solo-admin a la ficha del partido en el panel admin.
 * Renderiza un <span> (no un <button>) para poder vivir dentro de filas/tarjetas
 * clicables sin anidar elementos interactivos. Hace stopPropagation.
 * Solo los partidos guardados en BD (id numérico) se pueden editar; los `ffm-*` son solo JSON.
 */
export default function AdminMatchEditButton({ matchId, variant = 'icon', className = '' }) {
  const { isAdmin } = useApp();
  const navigate = useNavigate();

  if (!isAdmin || matchId == null || !/^\d+$/.test(String(matchId))) return null;

  const go = (e) => {
    e?.stopPropagation?.();
    navigate(`/admin/partidos?edit=${matchId}`);
  };
  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      navigate(`/admin/partidos?edit=${matchId}`);
    }
  };

  if (variant === 'bar') {
    return (
      <div className={`flex items-center justify-between gap-2 border-b border-dashed border-re-dorado/30 bg-re-dorado/10 px-4 py-2 sm:px-5 ${className}`}>
        <span className="text-[9px] font-black uppercase tracking-widest text-re-dorado">Solo admin</span>
        <span
          role="button"
          tabIndex={0}
          onClick={go}
          onKeyDown={onKeyDown}
          className="cursor-pointer rounded-full border border-re-dorado/50 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-re-dorado hover:bg-re-dorado hover:text-white transition-colors"
        >
          ✎ Editar este partido
        </span>
      </div>
    );
  }

  return (
    <span
      role="button"
      tabIndex={0}
      title="Ver y editar en el panel admin"
      aria-label="Ver y editar en el panel admin"
      onClick={go}
      onKeyDown={onKeyDown}
      className={`inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-full border border-re-dorado/50 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-re-dorado hover:bg-re-dorado hover:text-white transition-colors sm:text-[9px] ${className}`}
    >
      ✎ Editar
    </span>
  );
}
