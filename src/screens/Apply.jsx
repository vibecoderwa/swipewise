import ScreenHeader from '../components/ScreenHeader.jsx';
import Recommendations from '../components/Recommendations.jsx';

export default function ApplyScreen({ recommendations, cards }) {
  if (!recommendations) return <div className="screen"><div className="loading">Loading…</div></div>;

  return (
    <div className="screen">
      <ScreenHeader eyebrow="Agent recommendations" title="Cards worth " em="applying for" />
      <Recommendations data={recommendations} allCards={cards} />
    </div>
  );
}
