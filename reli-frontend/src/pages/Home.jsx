import HeroMatch from '../components/HeroMatch';
import LastMatches from '../components/LastMatches';
import NewsSection from '../components/NewsSection';
import TopScorers from '../components/TopScorers';
import MatchesCarousel from '../components/MatchesCarousel';

export default function Home() {
  return (
    <main className="max-w-7xl mx-auto p-6 space-y-10 lg:space-y-14">
      <HeroMatch />
      <LastMatches />
      <NewsSection />
      <TopScorers />
      <MatchesCarousel />
    </main>
  );
}
