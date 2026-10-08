// Scompone un link di esempio: la parte prima di # va al server, quella dopo resta nel browser.
// Con la password attiva il frammento prende il prefisso "p." e compare il secondo fattore.
export default function LinkAnatomy({ withPassword = false }) {
  const host = typeof window !== 'undefined' ? window.location.host : 'erchomai.app';
  return (
    <figure className="anatomy">
      <div className="anatomy-row">
        <div className="anatomy-url" aria-hidden="true">
          <span className="anatomy-server">{host}/d/7Qm2fX9a</span>
          <span className="anatomy-key">#{withPassword ? 'p.' : ''}kV3p…Zr8w</span>
        </div>
        {withPassword && (
          <span className="anatomy-pw" aria-hidden="true">+ password</span>
        )}
      </div>
      <figcaption className="anatomy-legend">
        <span className="legend-server">Arriva al server: identifica i dati cifrati</span>
        <span className="legend-key">Resta nel browser: è il segreto da cui derivano le chiavi</span>
        {withPassword && (
          <span className="legend-pw">Non sta nel link: va comunicata su un altro canale</span>
        )}
      </figcaption>
    </figure>
  );
}
