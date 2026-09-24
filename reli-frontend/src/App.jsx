import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { motion, MotionConfig } from 'framer-motion';
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
import QuintetPage from './pages/QuintetPage';
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
import EmailActionPage from './pages/EmailActionPage';

function PublicLayout() {
  const { theme, toggleTheme, user, isAdmin, openAuth, handleLogout } = useApp();
  const location = useLocation();
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
      <MotionConfig reducedMotion="user">
        <motion.div
          key={location.pathname}
          className="flex-1"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          <Outlet />
        </motion.div>
      </MotionConfig>
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
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/partidos/:id" element={<MatchDetail />} />
          <Route path="/noticias/:id" element={<NewsDetail />} />
          <Route path="/noticias" element={<NewsPage />} />
          <Route path="/competicion" element={<CompetitionPage />} />
          <Route path="/historia" element={<HistoryPage />} />
          <Route path="/jugadores" element={<PlayersPage />} />
          <Route path="/quinteto" element={<QuintetPage />} />
          <Route path="/calendario" element={<CalendarPage />} />
          <Route path="/auth" element={<EmailActionPage />} />
        </Route>
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
