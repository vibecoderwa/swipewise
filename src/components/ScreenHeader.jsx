export default function ScreenHeader({ eyebrow, title, em, right, onBack }) {
  return (
    <header className={`screen-header ${onBack ? 'with-back' : ''}`}>
      {onBack && (
        <button
          type="button"
          className="header-back"
          onClick={onBack}
          aria-label="Back"
        >
          ‹
        </button>
      )}
      <div className="eyebrow">{eyebrow}</div>
      <h1>
        {title}{em && <> <em>{em}</em></>}
      </h1>
      {right && <div className="topright">{right}</div>}
    </header>
  );
}
