import Seo from '../components/Seo';
import MatchCalendar from '../components/MatchCalendar';

export default function CalendarPage() {
  return (
    <main className="max-w-5xl mx-auto p-4 sm:p-6">
      <Seo
        title="Calendario de partidos"
        description="Calendario de próximos partidos y resultados del Real Lisiados F.C. Consulta fechas, horarios, rivales y sedes."
        path="/calendario"
      />
      <MatchCalendar />
    </main>
  );
}
