import Icon from './Icon.jsx';

const TABS = [
  { id: 'home',     label: 'Home',     icon: 'home' },
  { id: 'cats',     label: 'Categories', icon: 'grid' },
  { id: 'apply',    label: 'Apply',    icon: 'trend' },
  { id: 'credits',  label: 'Credits',  icon: 'gift' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

export default function TabBar({ active, onChange }) {
  return (
    <nav className="tabbar">
      <div className="tabbar-inner">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`tab ${active === t.id ? 'active' : ''}`}
            onClick={() => onChange(t.id)}
            aria-label={t.label}
          >
            <Icon name={t.icon} size={22} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
