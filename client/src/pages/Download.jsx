import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { receiveFile, saveBlob } from '../transfer';
import Shell from '../components/Shell';
import { ReceiveExplainer } from '../components/Explainers';
import Progress from '../components/Progress';
import { LockIcon, CheckIcon } from '../components/Icons';

export default function Download() {
  const { id } = useParams();
  const [keyB64] = useState(() => window.location.hash.slice(1));
  const [status, setStatus] = useState(keyB64 ? 'idle' : 'error');
  const [error, setError] = useState(keyB64 ? '' : 'Link incompleto: manca la chiave dopo il simbolo #.');
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState('');

  // Rimuove la chiave dalla barra degli indirizzi dopo averla letta
  useEffect(() => {
    if (window.location.hash) history.replaceState(null, '', window.location.pathname);
  }, []);

  async function handleDownload() {
    setStatus('working');
    setError('');
    setProgress(0);
    try {
      const { blob, name } = await receiveFile(id, keyB64, setProgress);
      saveBlob(blob, name);
      setFileName(name);
      setStatus('done');
    } catch (e) {
      setError(e.message);
      setStatus('error');
    }
  }

  return (
    <Shell aside={<ReceiveExplainer />}>
      <h1>Hai ricevuto un file</h1>
      <p className="lead">
        Il file è cifrato end-to-end. Verrà scaricato e decifrato qui, nel tuo browser.
      </p>

      <div className="file">
        <div className="file-badge"><LockIcon /></div>
        <div className="file-meta">
          <div className="file-name">{status === 'done' ? fileName : 'File cifrato'}</div>
          <div className="file-size">
            {status === 'done' ? 'Decifrato e salvato' : 'Il nome compare dopo la decifratura'}
          </div>
        </div>
      </div>

      {keyB64 && status !== 'done' && (
        <button className="btn" disabled={status === 'working'} onClick={handleDownload}>
          {status === 'working' ? 'Decifratura in corso…' : 'Scarica e decifra'}
        </button>
      )}

      {status === 'working' && <Progress value={progress} label="Download e verifica" />}

      {status === 'done' && (
        <section className="result">
          <p className="ok"><CheckIcon /> Integrità verificata</p>
          <p className="hint">Trovi «{fileName}» nella cartella dei download.</p>
        </section>
      )}

      {status === 'error' && <p className="alert" role="alert">{error}</p>}
    </Shell>
  );
}
