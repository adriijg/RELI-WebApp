import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '../../components/admin/PageHeader';
import DataTable from '../../components/admin/DataTable';
import EntityFormModal from '../../components/admin/EntityFormModal';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import { useCrud } from '../../hooks/useCrud';
import { createMatch, deleteMatch, getCompetitions, getMatches, getSeasons, toPage, updateMatch, getMatchDetail, addMatchGoal, deleteMatchGoal, getAllPlayers, getPlayerSeasonStats, getStats, createStat, updateStat, addMatchCallup, deleteMatchCallup } from '../../services/api';
import { STATUS_LABELS } from '../../constants/matchStatus';
import { POSITION_LABELS } from '../../constants/positions';
import { rememberAdminMatch } from '../../utils/adminRecentMatches';

const TIME_OPTIONS = (() => {
  const opts = [];
  for (let mins = 7 * 60; mins <= 22 * 60; mins += 30) {
    const hh = String(Math.floor(mins / 60)).padStart(2, '0');
    const mm = String(mins % 60).padStart(2, '0');
    opts.push({ value: `${hh}:${mm}`, label: `${hh}:${mm}` });
  }
  return opts;
})();

const normalizeTime = (time) => {
  if (!time || !time.trim()) return '';
  const match = time.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) throw new Error('La hora debe tener el formato HH:MM (ej. 19:30)');
  const hh = match[1].padStart(2, '0');
  if (Number(hh) > 23 || Number(match[2]) > 59) throw new Error('La hora introducida no es válida');
  return `${hh}:${match[2]}`;
};

function useRosterPlayers(matchId) {
  const [players, setPlayers] = useState([]);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    if (!matchId) return;
    setLoading(true);
    try {
      const d = await getMatchDetail(matchId);
      setDetail(d);
      try {
        if (d?.match?.competitionId) {
          const comps = await getCompetitions({ size: 200 });
          const comp = toPage(comps).content.find(c => String(c.id) === String(d.match.competitionId));
          const seasonId = comp?.seasonId;
          if (seasonId) {
            const stats = await getPlayerSeasonStats({ seasonId });
            if (Array.isArray(stats) && stats.length) {
              setPlayers(stats.map(s => ({ id: s.playerId, name: s.name, nickname: s.nickname, jerseyNumber: s.jerseyNumber, position: s.position })));
            } else {
              const all = await getAllPlayers();
              setPlayers(Array.isArray(all) ? all : []);
            }
          } else {
            const all = await getAllPlayers();
            setPlayers(Array.isArray(all) ? all : []);
          }
        } else {
          const all = await getAllPlayers();
          setPlayers(Array.isArray(all) ? all : []);
        }
      } catch { const all = await getAllPlayers().catch(()=>[]); setPlayers(Array.isArray(all)?all:[]); }
    } catch { setDetail(null); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [matchId]);
  return { players, detail, setDetail, loading, reload: load };
}

function GoleadoresSection({ matchId }) {
  const { players, detail, setDetail, loading } = useRosterPlayers(matchId);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [minute, setMinute] = useState('');
  const [saving, setSaving] = useState(false);
  const syncStatForPlayer = async (playerId, delta) => {
    try {
      const res = await getStats({ matchId, size: 200 });
      const list = res?.content || res || [];
      const existing = Array.isArray(list) ? list.find(s => String(s.playerId) === String(playerId)) : null;
      if (existing) {
        const newGoals = Math.max(0, (existing.goals || 0) + delta);
        await updateStat(existing.id, { playerId: Number(playerId), matchId, goals: newGoals, assists: existing.assists || 0, yellowCards: existing.yellowCards || 0, redCards: existing.redCards || 0, mvp: !!existing.mvp, attended: true });
      } else if (delta > 0) {
        await createStat({ playerId: Number(playerId), matchId, goals: delta, assists: 0, yellowCards: 0, redCards: 0, mvp: false, attended: true });
      }
    } catch {}
  };
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!selectedPlayer || !minute) return;
    const m = parseInt(minute, 10);
    if (isNaN(m) || m < 1 || m > 120) { alert('Minuto debe estar entre 1 y 120'); return; }
    const player = players.find(p => String(p.id) === String(selectedPlayer));
    if (!player) return;
    const tempId = `temp-${Date.now()}`;
    const optimistic = { id: tempId, playerId: Number(selectedPlayer), playerName: player.nickname || player.name, jerseyNumber: player.jerseyNumber, minute: m };
    setDetail(prev => prev ? { ...prev, goals: [...(prev.goals || []), optimistic], match: { ...prev.match, ourGoals: (prev.goals?.length || 0) + 1, status: 'FINISHED' } } : prev);
    setMinute('');
    setSaving(true);
    try {
      const created = await addMatchGoal(matchId, { playerId: Number(selectedPlayer), minute: m });
      setDetail(prev => prev ? { ...prev, goals: prev.goals.map(g => g.id === tempId ? created : g) } : prev);
      syncStatForPlayer(selectedPlayer, 1);
      getMatchDetail(matchId).then(d => {
        const count = (d?.goals || []).length;
        if (d?.match && (d.match.ourGoals !== count || d.match.status !== 'FINISHED')) {
          updateMatch(matchId, { ...d.match, competitionId: d.match.competitionId, ourGoals: count, status: 'FINISHED' }).catch(()=>{});
        }
      });
    } catch (err) {
      setDetail(prev => prev ? { ...prev, goals: (prev.goals || []).filter(g => g.id !== tempId), match: { ...prev.match, ourGoals: Math.max(0, (prev.goals?.length || 1) - 1) } } : prev);
      alert(err.message || 'Error al añadir gol');
    } finally { setSaving(false); }
  };
  const handleDelete = async (goalId) => {
    const goal = detail?.goals?.find(g => g.id === goalId);
    const playerId = goal?.playerId;
    const snapshot = detail;
    // optimistic: quita al instante sin fantasma
    setDetail(prev => prev ? { ...prev, goals: (prev.goals || []).filter(g => g.id !== goalId), match: { ...prev.match, ourGoals: Math.max(0, (prev.goals?.length || 1) - 1) } } : prev);
    try {
      await deleteMatchGoal(matchId, goalId);
      if (playerId) await syncStatForPlayer(playerId, -1).catch(()=>{});
      // sincroniza en background sin bloquear UI
      getMatchDetail(matchId).then(d => {
        if (!d) return;
        const count = (d?.goals || []).length;
        if (d?.match && d.match.ourGoals !== count) {
          updateMatch(matchId, { ...d.match, competitionId: d.match.competitionId, ourGoals: count }).catch(()=>{});
        }
        // no setDetail aquí para no re-pintar con delay; el optimistic ya está
      }).catch(()=>{});
    } catch (err) {
      setDetail(snapshot);
      alert(err.message || 'Error al borrar');
    }
  };
  if (!matchId) return <p className="text-[11px] text-muted-foreground">Guarda el partido primero para añadir goleadores.</p>;
  if (loading) return <p className="text-sm text-muted-foreground">Cargando goleadores…</p>;
  const goals = detail?.goals || [];
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-card-border bg-muted/5 p-4">
        <h4 className="text-[11px] font-black uppercase tracking-widest text-re-dorado mb-3">Nuestros goleadores</h4>
        {goals.length === 0 ? <p className="text-[11px] font-bold text-muted-foreground py-2">Aún no hay goleadores.</p> : (
          <ul className="space-y-2">
            {goals.map(g => (
              <li key={g.id} className="flex items-center gap-3 bg-card-bg border border-card-border rounded-xl px-3 py-2">
                <span className="w-8 h-8 rounded-lg bg-re-rojo text-white font-black text-xs flex items-center justify-center">#{g.jerseyNumber}</span>
                <span className="flex-1 min-w-0"><span className="font-black text-sm">{g.playerName}</span><span className="ml-2 text-[11px] text-muted-foreground">{g.minute}'</span></span>
                <button onClick={() => handleDelete(g.id)} className="text-re-rojo text-[10px] font-black uppercase">Quitar</button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2 items-end bg-card-bg border border-card-border rounded-2xl p-4">
        <label className="flex-1"><span className="text-[10px] font-black uppercase tracking-widest">Jugador</span>
          <select value={selectedPlayer} onChange={e=>setSelectedPlayer(e.target.value)} className="w-full mt-1 rounded-xl border border-card-border bg-background px-3 py-2.5 text-sm font-bold">
            <option value="">Selecciona…</option>
            {players.map(p => <option key={p.id} value={p.id}>#{p.jerseyNumber} {p.nickname || p.name} — {POSITION_LABELS[p.position]||p.position}</option>)}
          </select>
        </label>
        <label className="w-28"><span className="text-[10px] font-black uppercase tracking-widest">Minuto</span>
          <input type="number" min="1" max="120" value={minute} onChange={e=>setMinute(e.target.value)} placeholder="23" className="w-full mt-1 rounded-xl border border-card-border bg-background px-3 py-2.5 text-sm font-bold" />
        </label>
        <button type="submit" disabled={saving || !selectedPlayer || !minute} className="bg-re-rojo text-white font-black px-6 py-2.5 rounded-xl text-xs uppercase tracking-widest disabled:opacity-50">Añadir gol</button>
      </form>
    </div>
  );
}

function ConvocadosSection({ matchId }) {
  const { players, detail, setDetail, loading } = useRosterPlayers(matchId);
  const [savingId, setSavingId] = useState(null);
  const callups = detail?.callups || [];
  const callupIds = new Set(callups.map(c => String(c.playerId)));
  const toggle = async (player) => {
    const isIn = callupIds.has(String(player.id));
    if (isIn) {
      const callUp = callups.find(c => String(c.playerId) === String(player.id));
      if (!callUp) return;
      if (String(callUp.id).startsWith('temp-')) return;
      const snapshot = detail;
      setDetail(prev => prev ? { ...prev, callups: (prev.callups||[]).filter(c => String(c.playerId) !== String(player.id)) } : prev);
      setSavingId(String(player.id));
      try { await deleteMatchCallup(matchId, callUp.id); } catch (err) { setDetail(snapshot); alert(err.message||'Error'); } finally { setSavingId(null); }
    } else {
      const optimistic = { id: `temp-${Date.now()}`, playerId: Number(player.id), playerName: player.nickname || player.name, jerseyNumber: player.jerseyNumber, position: player.position };
      setDetail(prev => prev ? { ...prev, callups: [...(prev.callups||[]), optimistic] } : prev);
      setSavingId(String(player.id));
      try {
        const created = await addMatchCallup(matchId, { playerId: Number(player.id) });
        setDetail(prev => prev ? { ...prev, callups: prev.callups.map(c => String(c.id).startsWith('temp-') && String(c.playerId)===String(player.id) ? created : c) } : prev);
        try {
          const res = await getStats({ matchId, size: 200 });
          const list = res?.content || res || [];
          const existing = Array.isArray(list) ? list.find(s => String(s.playerId) === String(player.id)) : null;
          if (!existing) await createStat({ playerId: Number(player.id), matchId, goals: 0, assists: 0, yellowCards: 0, redCards: 0, mvp: false, attended: true });
          else if (!existing.attended) await updateStat(existing.id, { playerId: Number(player.id), matchId, goals: existing.goals||0, assists: existing.assists||0, yellowCards: existing.yellowCards||0, redCards: existing.redCards||0, mvp: !!existing.mvp, attended: true });
        } catch {}
      } catch (err) {
        setDetail(prev => prev ? { ...prev, callups: (prev.callups||[]).filter(c => String(c.playerId) !== String(player.id)) } : prev);
        alert(err.message || 'Error');
      } finally { setSavingId(null); }
    }
  };
  if (!matchId) return <p className="text-[11px] text-muted-foreground">Guarda el partido primero.</p>;
  if (loading) return <p className="text-sm text-muted-foreground">Cargando convocados…</p>;
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-bold text-muted-foreground">Toca al jugador para convocar / desconvocar. Sin checkbox.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {players.map(p => {
          const isIn = callupIds.has(String(p.id));
          const saving = savingId === String(p.id);
          return (
            <button key={p.id} type="button" onClick={()=>toggle(p)} disabled={saving} className={`flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-left transition-all ${isIn ? 'bg-re-rojo border-re-rojo text-white shadow-md' : 'bg-card-bg border-card-border text-foreground hover:border-re-rojo/30'} ${saving ? 'opacity-60' : ''}`}>
              <span className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${isIn ? 'bg-white text-re-rojo' : 'bg-re-azul-oscuro text-white'}`}>#{p.jerseyNumber}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-black leading-none">{p.nickname || p.name}</span>
                <span className={`block text-[10px] uppercase tracking-widest ${isIn ? 'text-white/80' : 'text-muted-foreground'}`}>{POSITION_LABELS[p.position]||p.position}</span>
              </span>
              {isIn && <span className="shrink-0 text-[10px] font-black">✓</span>}
            </button>
          );
        })}
      </div>
      <p className="text-center text-[11px] font-bold text-muted-foreground">{callups.length} convocados</p>
    </div>
  );
}

function TarjetasSection({ matchId }) {
  const [detail, setDetail] = useState(null);
  const [stats, setStats] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState('');
  const [yellow, setYellow] = useState(0);
  const [red, setRed] = useState(0);
  const [saving, setSaving] = useState(false);
  const load = async () => {
    setLoading(true);
    try {
      const [d, s, all] = await Promise.all([getMatchDetail(matchId).catch(()=>null), getStats({ matchId, size: 200 }).catch(()=>null), getAllPlayers().catch(()=>[])]);
      setDetail(d);
      const list = s?.content || s || [];
      setStats(Array.isArray(list)?list:[]);
      // roster para selector
      try {
        if (d?.match?.competitionId) {
          const comps = await getCompetitions({ size: 200 });
          const comp = toPage(comps).content.find(c => String(c.id)===String(d.match.competitionId));
          const seasonId = comp?.seasonId;
          if (seasonId) {
            const st = await getPlayerSeasonStats({ seasonId });
            if (Array.isArray(st) && st.length) { setPlayers(st.map(x=>({ id: x.playerId, name: x.name, nickname: x.nickname, jerseyNumber: x.jerseyNumber })) ); }
            else setPlayers(Array.isArray(all)?all:[]);
          } else setPlayers(Array.isArray(all)?all:[]);
        } else setPlayers(Array.isArray(all)?all:[]);
      } catch { setPlayers(Array.isArray(all)?all:[]); }
    } finally { setLoading(false); }
  };
  useEffect(()=>{ load(); }, [matchId]);
  const carded = stats.filter(s => (s.yellowCards||0)>0 || (s.redCards||0)>0);
  const handleSave = async (e) => {
    e.preventDefault();
    if (!selected) return;
    const player = players.find(p => String(p.id)===String(selected));
    const tempId = `temp-${Date.now()}`;
    const y = Number(yellow), r = Number(red);
    const existing = stats.find(s => String(s.playerId)===String(selected));
    const optimistic = existing
      ? { ...existing, yellowCards: y, redCards: r }
      : { id: tempId, playerId: Number(selected), playerName: player ? (player.nickname || player.name) : 'Jugador', yellowCards: y, redCards: r, goals: 0, assists: 0, mvp: false, attended: true };
    if (existing) setStats(prev => prev.map(s => String(s.playerId)===String(selected) ? optimistic : s));
    else setStats(prev => [...prev, optimistic]);
    setSelected(''); setYellow(0); setRed(0);
    setSaving(true);
    try {
      let saved;
      if (existing) {
        saved = await updateStat(existing.id, { playerId: Number(selected), matchId, goals: existing.goals||0, assists: existing.assists||0, yellowCards: y, redCards: r, mvp: !!existing.mvp, attended: true });
      } else {
        saved = await createStat({ playerId: Number(selected), matchId, goals: 0, assists: 0, yellowCards: y, redCards: r, mvp: false, attended: true });
      }
      setStats(prev => prev.map(s => String(s.playerId)===String(selected) ? (saved || optimistic) : s).filter(s => (s.yellowCards||0)>0 || (s.redCards||0)>0 || s.goals>0 || s.assists>0 || s.attended));
    } catch (err) {
      setStats(prev => existing ? prev.map(s => String(s.playerId)===String(selected) ? existing : s) : prev.filter(s => String(s.playerId)!==String(selected)));
      alert(err.message||'Error');
    } finally { setSaving(false); }
  };
  const handleClear = async (s) => {
    const snapshot = stats;
    setStats(prev => prev.map(x => x.id===s.id ? { ...x, yellowCards: 0, redCards: 0 } : x).filter(x => (x.yellowCards||0)>0 || (x.redCards||0)>0 || x.goals>0));
    try { await updateStat(s.id, { playerId: s.playerId, matchId, goals: s.goals||0, assists: s.assists||0, yellowCards: 0, redCards: 0, mvp: !!s.mvp, attended: s.attended }); } catch (err){ setStats(snapshot); alert(err.message||'Error'); }
  };
  if (loading) return <p className="text-sm text-muted-foreground">Cargando tarjetas…</p>;
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-card-border bg-muted/5 p-4">
        <h4 className="text-[11px] font-black uppercase tracking-widest text-re-dorado mb-3">Tarjetas ({carded.length})</h4>
        {carded.length===0 ? <p className="text-[11px] font-bold text-muted-foreground py-2">Sin tarjetas.</p> : (
          <ul className="space-y-2">
            {carded.map(s => (
              <li key={s.id} className="flex items-center gap-3 bg-card-bg border border-card-border rounded-xl px-3 py-2">
                <span className="flex-1 min-w-0 font-black text-sm">{s.playerName} <span className="ml-2 inline-flex gap-1">{s.yellowCards>0 && <span className="w-3 h-4 rounded-[3px] bg-yellow-400 border border-yellow-600 inline-block" />}{s.yellowCards>1?`x${s.yellowCards}`:''} {s.redCards>0 && <span className="w-3 h-4 rounded-[3px] bg-red-600 border border-red-800 inline-block ml-1" />}{s.redCards>1?`x${s.redCards}`:''}</span></span>
                <span className="text-[11px] font-bold text-muted-foreground">{s.yellowCards} amarilla{s.yellowCards!==1?'s':''} · {s.redCards} roja{s.redCards!==1?'s':''}</span>
                <button onClick={()=>handleClear(s)} className="text-re-rojo text-[10px] font-black uppercase">Quitar</button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <form onSubmit={handleSave} className="bg-card-bg border border-card-border rounded-2xl p-4 space-y-3">
        <h4 className="text-[10px] font-black uppercase tracking-widest">Añadir / editar tarjeta</h4>
        <div className="flex flex-col sm:flex-row gap-2">
          <label className="flex-1"><span className="text-[10px] font-black uppercase tracking-widest">Jugador</span>
            <select value={selected} onChange={e=>setSelected(e.target.value)} className="w-full mt-1 rounded-xl border border-card-border bg-background px-3 py-2.5 text-sm font-bold">
              <option value="">Selecciona…</option>
              {players.map(p => <option key={p.id} value={p.id}>#{p.jerseyNumber} {p.nickname || p.name}</option>)}
            </select>
          </label>
          <label className="w-24"><span className="text-[10px] font-black uppercase tracking-widest">Amarillas</span>
            <select value={yellow} onChange={e=>setYellow(Number(e.target.value))} className="w-full mt-1 rounded-xl border border-card-border bg-background px-3 py-2.5 text-sm font-bold">
              <option value={0}>0</option><option value={1}>1</option><option value={2}>2</option>
            </select>
          </label>
          <label className="w-24"><span className="text-[10px] font-black uppercase tracking-widest">Rojas</span>
            <select value={red} onChange={e=>setRed(Number(e.target.value))} className="w-full mt-1 rounded-xl border border-card-border bg-background px-3 py-2.5 text-sm font-bold">
              <option value={0}>0</option><option value={1}>1</option>
            </select>
          </label>
        </div>
        <button type="submit" disabled={saving || !selected} className="w-full bg-re-rojo text-white font-black py-2.5 rounded-xl text-xs uppercase tracking-widest disabled:opacity-50">Guardar tarjetas</button>
      </form>
    </div>
  );
}

function ActaExtra({ matchId }) {
  const [tab, setTab] = useState('goles');
  const [scrapeLoading, setScrapeLoading] = useState(false);
  const [scrapeMsg, setScrapeMsg] = useState('');
  const handleScrapeThis = async () => {
    if (!confirm('¿Scrapear acta FFM de este partido? Se importarán convocados, goles y tarjetas desde la federación.')) return;
    setScrapeLoading(true); setScrapeMsg('');
    try {
      const { scrapeMatchActa } = await import('../../services/api');
      const res = await scrapeMatchActa(matchId);
      setScrapeMsg(`Acta importada: ${res.actasProcessed} acta, ${res.callupsCreated} convocados, ${res.goalsCreated} goles`);
      // forzar recarga de las 3 pestañas al cambiar
      setTab('goles'); setTimeout(()=>setTab('convocados'), 100); setTimeout(()=>setTab('goles'), 300);
    } catch (e) { setScrapeMsg(e.message || 'Error al scrapear'); alert(e.message || 'Error'); }
    finally { setScrapeLoading(false); }
  };
  if (!matchId) return <p className="text-[11px] text-muted-foreground">Guarda el partido primero.</p>;
  return (
    <div className="space-y-4">
      <button onClick={handleScrapeThis} disabled={scrapeLoading} className="w-full rounded-xl border border-re-dorado/30 bg-re-dorado/10 py-2.5 text-[11px] font-black uppercase tracking-widest text-re-dorado hover:bg-re-dorado hover:text-white disabled:opacity-50">
        {scrapeLoading ? 'Scrapeando acta…' : 'Scrapear acta FFM de este partido (manual)'}
      </button>
      {scrapeMsg && <p className="text-[11px] font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">{scrapeMsg}</p>}
      <div className="flex gap-2 border-b border-card-border">
        {[
          { id: 'convocados', label: 'Convocados' },
          { id: 'goles', label: 'Goleadores' },
          { id: 'tarjetas', label: 'Tarjetas' },
        ].map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} className={`px-3 py-2 text-[11px] font-black uppercase tracking-widest border-b-2 ${tab===t.id ? 'border-re-rojo text-re-rojo' : 'border-transparent text-muted-foreground'}`}>{t.label}</button>
        ))}
      </div>
      {tab==='goles' && <GoleadoresSection matchId={matchId} />}
      {tab==='convocados' && <ConvocadosSection matchId={matchId} />}
      {tab==='tarjetas' && <TarjetasSection matchId={matchId} />}
    </div>
  );
}

export default function MatchesAdmin() {
  const [searchParams] = useSearchParams();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [competitions, setCompetitions] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState('');

  const crud = useCrud({
    fetchPage: getMatches,
    createItem: createMatch,
    updateItem: updateMatch,
    deleteItem: deleteMatch,
    pageSize: 1000,
    sortBy: 'date',
    direction: 'desc',
  });

  useEffect(() => {
    Promise.all([
      getCompetitions({ size: 100 }),
      getSeasons({ size: 100, sortBy: 'name', direction: 'desc' }),
    ]).then(([competitionData, seasonData]) => {
      setCompetitions(toPage(competitionData).content);
      const seasonList = toPage(seasonData).content;
      setSeasons(seasonList);
      const current = seasonList.find(season => season.current) || seasonList[0];
      if (current) setSelectedSeasonId(String(current.id));
    }).catch(() => {
      setCompetitions([]);
      setSeasons([]);
    });
  }, []);

  const fields = [
    { name: 'rival', label: 'Rival', type: 'text', required: true, placeholder: 'Ej. C.D. Rivales' },
    { name: 'home', label: 'Jugamos como', type: 'select', required: true, default: 'true', options: [{ value: 'true', label: 'Local' }, { value: 'false', label: 'Visitante' }] },
    { name: 'date', label: 'Fecha', type: 'date' },
    { name: 'time', label: 'Hora', type: 'combobox', placeholder: 'Ej. 19:30', options: TIME_OPTIONS },
    { name: 'location', label: 'Sede', type: 'text', placeholder: 'Ej. Polideportivo Municipal' },
    { name: 'status', label: 'Estado', type: 'select', required: true, default: 'SCHEDULED', options: Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })) },
    { name: 'competitionId', label: 'Competición', type: 'select', required: true, options: competitions.map(c => ({ value: String(c.id), label: `${c.name} — ${c.seasonName||''}`.trim() })) },
    { name: 'ourGoals', label: 'Nuestros goles', type: 'number', min: 0 },
    { name: 'rivalGoals', label: 'Goles del rival', type: 'number', min: 0 },
    { name: 'jornada', label: 'Jornada', type: 'number', min: 1, placeholder: 'Solo ligas' },
  ];

  const shortRival = (name) => {
    if (!name) return '—';
    const w = String(name).trim().split(/\s+/);
    // tomar 2 primeras palabras o 14 chars
    const short = w.slice(0, 2).join(' ');
    return short.length > 14 ? short.slice(0, 14) + '.' : short;
  };
  const competitionSeasonById = new Map(competitions.map(competition => [String(competition.id), String(competition.seasonId ?? '')]));
  const seasonRows = selectedSeasonId
    ? crud.rows.filter(row => String(row.seasonId ?? competitionSeasonById.get(String(row.competitionId)) ?? '') === selectedSeasonId)
    : crud.rows;
  const columns = [
    { key: 'homeLabel', label: 'Campo', className: 'w-14', render: (_, row) => <span className={`inline-flex w-9 h-9 items-center justify-center rounded-xl text-[11px] font-black ${row.home ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'}`}>{row.home ? 'L' : 'V'}</span> },
    { key: 'rival', label: 'Rival', className: 'min-w-[160px]', render: (v) => <span className="font-black text-[15px] leading-none tracking-tight">{v}</span> },
    { key: 'date', label: 'Fecha', className: 'w-28', render: v => v ? <span className="text-[13px] font-bold text-foreground">{new Date(v).toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'2-digit'})}</span> : <span className="text-muted-foreground">—</span> },
    { key: 'status', label: 'Estado', className: 'w-28', render: v => <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${v==='FINISHED'?'bg-emerald-500/15 text-emerald-600': v==='POSTPONED'?'bg-orange-500/15 text-orange-600': v==='IN_PROGRESS'?'bg-blue-500/15 text-blue-600':'bg-re-rojo/15 text-re-rojo'}`}>{STATUS_LABELS[v]||v}</span> },
    { key: 'score', label: 'Resultado', className: 'w-24 text-center', render: (_, row) => row.status==='FINISHED' && row.ourGoals!=null && row.rivalGoals!=null ? <span className="font-black text-[18px] leading-none text-re-rojo">{row.ourGoals}-{row.rivalGoals}</span> : <span className="text-muted-foreground font-bold text-sm">—</span> },
  ];

  const handleOpenCreate = () => { setEditing(null); setModalOpen(true); };
  const handleOpenEdit = (row) => {
    rememberAdminMatch(row);
    const [datePart='', timePart=''] = String(row.date ?? '').split('T');
    setEditing({ ...row, competitionId: String(row.competitionId ?? ''), home: String(row.home ?? true), date: datePart, time: timePart ? timePart.slice(0,5) : '' });
    setModalOpen(true);
  };
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId || crud.loading || modalOpen) return;
    const row = crud.rows.find(item => String(item.id) === String(editId));
    if (row) handleOpenEdit(row);
  }, [searchParams, crud.loading, crud.rows, modalOpen]);
  const handleSubmit = async (values) => {
    const time = normalizeTime(values.time);
    const { time: _ignored, ...rest } = values;
    const payload = { ...rest, home: values.home===true||values.home==='true', location: values.location?.trim()?values.location.trim():null, date: values.date?`${values.date}T${time||'00:00'}:00`:null, competitionId: Number(values.competitionId), jornada: values.jornada?Number(values.jornada):null };
    await crud.save(payload, editing?.id);
    setModalOpen(false);
  };

  const [mobileQuery, setMobileQuery] = useState('');
  const [selectedMatchIds, setSelectedMatchIds] = useState(new Set());
  const [mobileBulkMode, setMobileBulkMode] = useState(false);
  const [longPressRow, setLongPressRow] = useState(null);
  const longPressTimer = useState(() => ({ current: null }))[0];
  const filteredRows = (() => {
    const q = mobileQuery.trim().toLowerCase();
    if (!q) return seasonRows;
    return seasonRows.filter(r => `${r.rival} ${r.competitionName||''} ${r.location||''}`.toLowerCase().includes(q));
  })();
  const groupedMobileRows = (() => {
    const groups = new Map();
    filteredRows.forEach(row => {
      const key = row.jornada == null ? '__none__' : String(row.jornada);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(row);
    });
    return Array.from(groups.entries()).sort(([a], [b]) => {
      if (a === '__none__') return 1;
      if (b === '__none__') return -1;
      return Number(a) - Number(b);
    });
  })();
  const toggleMatchSelection = (row) => {
    setSelectedMatchIds((current) => {
      const next = new Set(current);
      const id = String(row.id);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const handleBulkDelete = async (selected) => {
    if (!window.confirm(`¿Borrar ${selected.length} partidos seleccionados? También se eliminarán sus datos asociados.`)) return;
    try {
      await Promise.all(selected.map((row) => deleteMatch(row.id)));
      setSelectedMatchIds(new Set());
      await crud.load(crud.page);
    } catch (err) {
      alert(err.message || 'No se pudieron borrar todos los partidos');
      await crud.load(crud.page);
    }
  };
  const startLongPress = (row) => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => setLongPressRow(row), 550);
  };
  const cancelLongPress = () => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  };

  return (
    <div>
      <PageHeader
        title="Partidos"
        subtitle="Gestiona el calendario, el acta y los goleadores."
        action={(
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <label className="sr-only" htmlFor="matches-season-filter">Temporada</label>
            <select
              id="matches-season-filter"
              value={selectedSeasonId}
              onChange={event => setSelectedSeasonId(event.target.value)}
              className="bg-card-bg border border-card-border rounded-xl px-3 py-3 text-xs font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-re-rojo/40"
            >
              {seasons.map(season => <option key={season.id} value={season.id}>{season.name}</option>)}
            </select>
            <button onClick={handleOpenCreate} className="bg-re-rojo text-white font-black px-6 py-3.5 rounded-xl text-xs tracking-widest uppercase shadow-lg shadow-re-rojo/20 hover:bg-re-rojo/90 hover:-translate-y-0.5 transition-all">+ Nuevo partido</button>
          </div>
        )}
      />
      {/* Mobile cards: rival corto, fecha con año y resultado sin arrastrar */}
      <div className="sm:hidden space-y-3 mb-4">
        <div className="relative">
          <input type="search" value={mobileQuery} onChange={e=>setMobileQuery(e.target.value)} placeholder="Buscar rival…" className="w-full bg-card-bg border border-card-border rounded-2xl pl-10 pr-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-re-rojo/40" />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" /></svg>
        </div>
        {selectedMatchIds.size > 0 && (
          <button type="button" onClick={() => handleBulkDelete(filteredRows.filter(row => selectedMatchIds.has(String(row.id))))} className="w-full rounded-xl bg-re-rojo py-3 text-[10px] font-black uppercase tracking-widest text-white">
            Borrar seleccionados ({selectedMatchIds.size})
          </button>
        )}
        <button type="button" onClick={() => { setMobileBulkMode(current => !current); setSelectedMatchIds(new Set()); }} className={`w-full rounded-xl border py-3 text-[10px] font-black uppercase tracking-widest ${mobileBulkMode ? 'border-re-rojo bg-re-rojo/10 text-re-rojo' : 'border-card-border text-muted-foreground'}`}>
          {mobileBulkMode ? 'Salir de selección' : 'Seleccionar partidos'}
        </button>
        {crud.loading ? (
          <div className="h-24 rounded-2xl bg-card-bg animate-pulse" />
        ) : filteredRows.length === 0 ? (
          <p className="text-center py-8 text-sm font-bold text-muted-foreground">{mobileQuery ? 'Sin resultados.' : 'Todavía no hay partidos.'}</p>
        ) : (
          groupedMobileRows.map(([jornada, jornadaRows]) => (
            <div key={jornada} className="space-y-2">
              <div className="flex items-center gap-3 px-1 pt-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-re-rojo">{jornada === '__none__' ? 'Sin jornada' : `Jornada ${jornada}`}</span>
                <span className="h-px flex-1 bg-card-border" />
              </div>
              {jornadaRows.map(row => (
                <button
                  key={row.id}
                  onClick={() => mobileBulkMode ? toggleMatchSelection(row) : handleOpenEdit(row)}
                  onTouchStart={() => startLongPress(row)}
                  onTouchEnd={cancelLongPress}
                  onTouchMove={cancelLongPress}
                  onMouseDown={() => startLongPress(row)}
                  onMouseUp={cancelLongPress}
                  onMouseLeave={cancelLongPress}
                  className="w-full flex items-center gap-3 bg-card-bg border border-card-border rounded-2xl px-4 py-3.5 text-left active:scale-[0.99] transition-all"
                >
                  {mobileBulkMode && <input type="checkbox" checked={selectedMatchIds.has(String(row.id))} onChange={() => toggleMatchSelection(row)} onClick={(event) => event.stopPropagation()} aria-label={`Seleccionar partido contra ${row.rival}`} className="shrink-0" />}
                  <span className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-black text-white ${row.home ? 'bg-emerald-500' : 'bg-blue-500'}`}>{row.home ? 'L' : 'V'}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block truncate font-black text-[15px] leading-none tracking-tight">{shortRival(row.rival)}</span>
                    <span className="block text-[11px] font-bold text-muted-foreground leading-none mt-1">{row.date ? new Date(row.date).toLocaleDateString('es-ES',{day:'2-digit',month:'2-digit',year:'2-digit'}) : 'Sin fecha'}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    {row.status==='FINISHED' && row.ourGoals!=null ? (
                      <span className="block font-black text-[18px] leading-none text-re-rojo">{row.ourGoals}-{row.rivalGoals}</span>
                    ) : (
                      <span className={`block w-2 h-2 rounded-full mx-auto ${row.status==='FINISHED'?'bg-emerald-500': row.status==='POSTPONED'?'bg-orange-500': row.status==='IN_PROGRESS'?'bg-blue-500':'bg-re-rojo'}`} />
                    )}
                    <span className="block text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-1">{row.status==='FINISHED' ? 'Final' : STATUS_LABELS[row.status]||row.status}</span>
                  </span>
                </button>
              ))}
            </div>
          ))
        )}
        {longPressRow && (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setLongPressRow(null)} />
            <div className="relative w-full max-w-sm bg-card-bg rounded-3xl p-4 space-y-3">
              <p className="text-center text-[11px] font-black uppercase tracking-widest text-muted-foreground">Mantener pulsado: {shortRival(longPressRow.rival)}</p>
              <button onClick={() => { setLongPressRow(null); handleOpenEdit(longPressRow); }} className="w-full bg-re-dorado text-white font-black py-3 rounded-2xl text-xs uppercase tracking-widest">Editar</button>
              <button onClick={() => { setLongPressRow(null); setDeleteTarget(longPressRow); }} className="w-full bg-re-rojo text-white font-black py-3 rounded-2xl text-xs uppercase tracking-widest">Eliminar partido</button>
              <button onClick={() => setLongPressRow(null)} className="w-full border border-card-border py-3 rounded-2xl text-xs font-black uppercase tracking-widest">Cancelar</button>
            </div>
          </div>
        )}
      </div>
      <div className="hidden sm:block">
        <DataTable columns={columns} rows={seasonRows} loading={crud.loading} error={crud.error} page={crud.page} totalPages={crud.totalPages} totalElements={seasonRows.length} onPageChange={crud.load} onRowClick={handleOpenEdit} onEdit={handleOpenEdit} onDelete={setDeleteTarget} onBulkDelete={handleBulkDelete} searchKeys={['rival','location','competitionName','status','homeLabel']} groupBy="jornada" groupLabel={(jornada) => jornada == null ? 'Sin jornada' : `Jornada ${jornada}`} emptyMessage="Todavía no hay partidos en esta temporada." />
      </div>

      <EntityFormModal
        open={modalOpen}
        title={editing ? 'Editar partido' : 'Nuevo partido'}
        fields={fields}
        initialValue={editing}
        onClose={()=>setModalOpen(false)}
        onSubmit={handleSubmit}
        extra={editing?.id ? <ActaExtra matchId={editing.id} /> : null}
      />

      <ConfirmDeleteModal open={Boolean(deleteTarget)} title="¿Borrar partido?" message={`Se eliminará el partido contra "${deleteTarget?.rival}" de forma permanente.`} onClose={()=>setDeleteTarget(null)} onConfirm={async()=>{ await crud.remove(deleteTarget.id); setDeleteTarget(null); }} />
    </div>
  );
}
