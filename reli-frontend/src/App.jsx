import { Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import RequireAdmin from './components/admin/RequireAdmin';
import ScrollToTop from './components/ScrollToTop';
import AdminLayout from './components/admin/AdminLayout';
import Home from './pages/Home';
import MatchDetail from './pages/MatchDetail';
import NewsDetail from './pages/NewsDetail';
import NewsPage from './pages/NewsPage';
import CompetitionPage from './pages/CompetitionPage';
import HistoryPage from './pages/HistoryPage';
import PlayersPage from './pages/PlayersPage';
import CalendarPage from './pages/CalendarPage';
import Dashboard from './pages/admin/Dashboard';
import MatchesAdmin from './pages/admin/MatchesAdmin';
import NewsAdmin from './pages/admin/NewsAdmin';
import PlayersAdmin from './pages/admin/PlayersAdmin';
import SeasonsAdmin from './pages/admin/SeasonsAdmin';
import CompetitionsAdmin from './pages/admin/CompetitionsAdmin';
import StatsAdmin from './pages/admin/StatsAdmin';
import UsersAdmin from './pages/admin/UsersAdmin';
import SyncAdmin from './pages/admin/SyncAdmin';

function PublicLayout({ children }) {
  const { theme, toggleTheme, user, isAdmin, openAuth, handleLogout } = useApp();
  return (
    <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-300 flex flex-col">
      <Navbar
        theme={theme}
        user={user}
        isAdmin={isAdmin}
        onToggleTheme={toggleTheme}
        onOpenAuth={openAuth}
        onLogout={handleLogout}
      />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}

export default function App() {
  const { theme, isAuthModalOpen, authModalView, closeAuth, handleAuthSuccess } = useApp();

  return (
    <div className={`${theme === 'dark' ? 'dark' : ''} min-h-screen bg-background text-foreground font-sans transition-colors duration-300`}>
      <ScrollToTop />
      <Routes>
        <Route
          path="/"
          element={
            <PublicLayout>
              <Home />
            </PublicLayout>
          }
        />
        <Route
          path="/partidos/:id"
          element={
            <PublicLayout>
              <MatchDetail />
            </PublicLayout>
          }
        />
        <Route
          path="/noticias/:id"
          element={
            <PublicLayout>
              <NewsDetail />
            </PublicLayout>
          }
        />
        <Route
          path="/noticias"
          element={
            <PublicLayout>
              <NewsPage />
            </PublicLayout>
          }
        />
        <Route
          path="/competicion"
          element={
            <PublicLayout>
              <CompetitionPage />
            </PublicLayout>
          }
        />
        <Route
          path="/historia"
          element={
            <PublicLayout>
              <HistoryPage />
            </PublicLayout>
          }
        />
        <Route
          path="/jugadores"
          element={
            <PublicLayout>
              <PlayersPage />
            </PublicLayout>
          }
        />
        <Route
          path="/calendario"
          element={
            <PublicLayout>
              <CalendarPage />
            </PublicLayout>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="partidos" element={<MatchesAdmin />} />
          <Route path="noticias" element={<NewsAdmin />} />
          <Route path="jugadores" element={<PlayersAdmin />} />
          <Route path="temporadas" element={<SeasonsAdmin />} />
          <Route path="competiciones" element={<CompetitionsAdmin />} />
          <Route path="estadisticas" element={<StatsAdmin />} />
          <Route path="usuarios" element={<UsersAdmin />} />
          <Route path="sincronizacion" element={<SyncAdmin />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuth}
        initialView={authModalView}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
