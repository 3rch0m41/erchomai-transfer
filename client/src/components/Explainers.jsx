import LinkAnatomy from './LinkAnatomy';
import { formatSize } from '../format';
import { MAX_FILE_SIZE } from '../transfer';

export function SendExplainer() {
  return (
    <>
      <h2 className="aside-title">Condividi file che solo il destinatario può leggere.</h2>
      <p className="aside-lead">
        La cifratura avviene sul tuo dispositivo. Al server arrivano solo blocchi cifrati,
        la chiave viaggia dentro il link.
      </p>

      <LinkAnatomy />

      <ol className="steps">
        <li>
          <strong>Il browser cifra il file</strong>
          <span>Una chiave AES-256 nuova per ogni file, generata con WebCrypto.</span>
        </li>
        <li>
          <strong>Carica i blocchi cifrati</strong>
          <span>Pezzi da 1 MB, ognuno legato alla sua posizione: riordinarli o tagliarli viene rilevato.</span>
        </li>
        <li>
          <strong>Condividi il link</strong>
          <span>Mandalo su un canale di cui ti fidi: chi ha il link completo può aprire il file.</span>
        </li>
      </ol>

      <dl className="facts">
        <div><dt>Scadenza</dt><dd>24 ore</dd></div>
        <div><dt>Dimensione massima</dt><dd>{formatSize(MAX_FILE_SIZE)}</dd></div>
        <div><dt>Account</dt><dd>Non serve</dd></div>
      </dl>
    </>
  );
}

export function ReceiveExplainer() {
  return (
    <>
      <h2 className="aside-title">Il file si apre solo qui, nel tuo browser.</h2>
      <p className="aside-lead">
        La chiave era nella parte del link dopo il simbolo #. Il browser non l'ha mai inviata
        al server, e l'abbiamo già tolta dalla barra degli indirizzi.
      </p>

      <ol className="steps">
        <li>
          <strong>Scarica i blocchi cifrati</strong>
          <span>Il server consegna solo dati illeggibili senza la chiave.</span>
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
