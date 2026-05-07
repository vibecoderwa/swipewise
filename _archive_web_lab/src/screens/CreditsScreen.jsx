import ScreenHeader from '../components/ScreenHeader.jsx';
import Credits from '../components/Credits.jsx';

export default function CreditsScreen({ insights }) {
  return (
    <div className="screen">
      <ScreenHeader eyebrow="Benefits · annual" title="Credits" />
      <Credits userCards={insights?.user_cards || []} />
    </div>
  );
}
