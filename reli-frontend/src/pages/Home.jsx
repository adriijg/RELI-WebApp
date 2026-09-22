import HeroMatch from '../components/HeroMatch';
import NewsSection from '../components/NewsSection';
import MatchesCarousel from '../components/MatchesCarousel';

export default function Home() {
  return (
    <main className="max-w-7xl mx-auto p-6 space-y-20">
      <HeroMatch />
      <NewsSection />
      <MatchesCarousel />
    </main>
  );
}
