import LinkAnatomy from './LinkAnatomy';
import { formatSize } from '../format';
import { MAX_FILE_SIZE } from '../transfer';

export function SendExplainer({ withPassword = false }) {
  return (
    <>
      <h2 className="aside-title">Condividi file che solo il destinatario può leggere.</h2>
      <p className="aside-lead">
        La cifratura avviene sul tuo dispositivo. Al server arrivano solo blocchi cifrati,
        il segreto per decifrarli viaggia dentro il link.
      </p>

      <LinkAnatomy withPassword={withPassword} />

      <ol className="steps">
        <li>
          <strong>Il browser cifra il file</strong>
          <span>
            Un segreto casuale di 256 bit per ogni file, da cui WebCrypto deriva le chiavi AES-256
            {withPassword ? ' insieme alla tua password.' : '.'}
          </span>
        </li>
        <li>
          <strong>Carica i blocchi cifrati</strong>
          <span>Pezzi da 1 MB, ognuno legato alla sua posizione: riordinarli o tagliarli viene rilevato.</span>
        </li>
        <li>
          <strong>Condividi il link</strong>
          <span>
            {withPassword
              ? 'Manda il link e la password su due canali diversi: servono entrambi per aprire il file.'
              : 'Mandalo su un canale di cui ti fidi: chi ha il link completo può aprire il file.'}
          </span>
        </li>
      </ol>

      <dl className="facts">
        <div><dt>Scadenza</dt><dd>24 ore</dd></div>
        <div><dt>Dimensione massima</dt><dd>{formatSize(MAX_FILE_SIZE)}</dd></div>
        <div><dt>Password</dt><dd>Facoltativa</dd></div>
        <div><dt>Account</dt><dd>Non serve</dd></div>
      </dl>
    </>
  );
}

export function ReceiveExplainer({ needsPassword = false }) {
  return (
    <>
      <h2 className="aside-title">Il file si apre solo qui, nel tuo browser.</h2>
      <p className="aside-lead">
        Il segreto era nella parte del link dopo il simbolo #. Il browser non l'ha mai inviato
        al server, e l'abbiamo già tolto dalla barra degli indirizzi.
      </p>

      <ol className="steps">
        {needsPassword && (
          <li>
            <strong>Inserisci la password</strong>
            <span>
              Il mittente l'ha scelta a parte e dovrebbe avertela data su un altro canale.
              Insieme al segreto del link ricostruisce le chiavi.
            </span>
          </li>
        )}
        <li>
          <strong>Scarica i blocchi cifrati</strong>
          <span>Il server consegna solo dati illeggibili senza le chiavi.</span>
        </li>
        <li>
          <strong>Verifica ogni blocco</strong>
          <span>AES-GCM controlla integrità e posizione: un blocco alterato blocca la decifratura.</span>
        </li>
        <li>
          <strong>Salva il file originale</strong>
          <span>Nome e dimensione vengono dal manifest cifrato, non dal server.</span>
        </li>
      </ol>
    </>
  );
}
