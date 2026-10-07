// Scompone un link di esempio: la parte prima di # va al server, quella dopo resta nel browser.
export default function LinkAnatomy() {
  const host = typeof window !== 'undefined' ? window.location.host : 'erchomai.app';
  return (
    <figure className="anatomy">
      <div className="anatomy-url" aria-hidden="true">
        <span className="anatomy-server">{host}/d/7Qm2fX9a</span>
        <span className="anatomy-key">#kV3p…Zr8w</span>
      </div>
      <figcaption className="anatomy-legend">
        <span className="legend-server">Arriva al server: identifica i dati cifrati</span>
        <span className="legend-key">Resta nel browser: è la chiave per decifrarli</span>
      </figcaption>
    </figure>
  );
}
