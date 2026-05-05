// Credits — standalone tab. The realized-vs-potential view of every credit
// across the user's wallet, with a one-tap "captured" toggle per credit.
import ScreenHeader from '../components/ScreenHeader.jsx';
import Folio from '../components/Folio.jsx';
import Credits from '../components/Credits.jsx';

export default function CreditsScreen({ insights }) {
  return (
    <div className="screen">
      <ScreenHeader
        eyebrow="Benefits · annual"
        title="Credits"
        em="captured."
        right={<Folio n={11} />}
      />
      <Credits userCards={insights?.user_cards || []} />
    </div>
  );
}
