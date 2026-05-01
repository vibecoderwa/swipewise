import ScreenHeader from '../components/ScreenHeader.jsx';
import Credits from '../components/Credits.jsx';

export default function CreditsScreen({ insights, onBack }) {
  return (
    <div className="screen">
      <ScreenHeader eyebrow="Benefits · annual" title="Credits" onBack={onBack} />
      <Credits userCards={insights?.user_cards || []} />
    </div>
  );
}
