// Folio — magazine-style "Nº 03" badge for app-shell screens.
// Used in screen-header `right` slot to give each screen a quiet identifier.
export default function Folio({ n }) {
  return (
    <span className="folio">
      <span className="folio-pre">Nº</span>
      <span className="folio-n">{String(n).padStart(2, '0')}</span>
    </span>
  );
}
