import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { motion, MotionConfig } from 'framer-motion';
import { useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import RequireAdmin from './components/admin/RequireAdmin';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';

const MatchDetail = lazy(() => import('./pages/MatchDetail'));
const NewsDetail = lazy(() => import('./pages/NewsDetail'));
const NewsPage = lazy(() => import('./pages/NewsPage'));
const CompetitionPage = lazy(() => import('./pages/CompetitionPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const PlayersPage = lazy(() => import('./pages/PlayersPage'));
const QuintetPage = lazy(() => import('./pages/QuintetPage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const KitCreator = lazy(() => import('./pages/KitCreator'));
const EmailActionPage = lazy(() => import('./pages/EmailActionPage'));

const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const MatchesAdmin = lazy(() => import('./pages/admin/MatchesAdmin'));
const GroupMatchesAdmin = lazy(() => import('./pages/admin/GroupMatchesAdmin'));
const NewsAdmin = lazy(() => import('./pages/admin/NewsAdmin'));
const PlayersAdmin = lazy(() => import('./pages/admin/PlayersAdmin'));
const SeasonsAdmin = lazy(() => import('./pages/admin/SeasonsAdmin'));
const CompetitionsAdmin = lazy(() => import('./pages/admin/CompetitionsAdmin'));
const StatsAdmin = lazy(() => import('./pages/admin/StatsAdmin'));
const UsersAdmin = lazy(() => import('./pages/admin/UsersAdmin'));
const SyncAdmin = lazy(() => import('./pages/admin/SyncAdmin'));
const EmailsAdmin = lazy(() => import('./pages/admin/EmailsAdmin'));

function RouteFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="Cargando">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-re-rojo border-t-transparent" />
    </div>
  );
}

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
      <Suspense fallback={<RouteFallback />}>
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
            <Route path="/equipaciones" element={<KitCreator />} />
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
            <Route path="partidos-grupo" element={<GroupMatchesAdmin />} />
            <Route path="noticias" element={<NewsAdmin />} />
            <Route path="jugadores" element={<PlayersAdmin />} />
            <Route path="temporadas" element={<SeasonsAdmin />} />
            <Route path="competiciones" element={<CompetitionsAdmin />} />
            <Route path="estadisticas" element={<StatsAdmin />} />
            <Route path="usuarios" element={<UsersAdmin />} />
            <Route path="sincronizacion" element={<SyncAdmin />} />
            <Route path="correos" element={<EmailsAdmin />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuth}
        initialView={authModalView}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
