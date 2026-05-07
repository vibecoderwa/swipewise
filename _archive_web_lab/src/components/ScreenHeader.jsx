export default function ScreenHeader({ eyebrow, title, em, right }) {
  return (
    <header className="screen-header">
      <div className="eyebrow">{eyebrow}</div>
      <h1>
        {title}{em && <> <em>{em}</em></>}
      </h1>
      {right && <div className="topright">{right}</div>}
    </header>
  );
}
