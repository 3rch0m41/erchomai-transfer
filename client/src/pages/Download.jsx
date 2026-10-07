import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { receiveFile, saveBlob } from '../transfer';

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
    <main>
      <h1>Erchomai Transfer</h1>
      <p>Hai ricevuto un file cifrato end-to-end.</p>

      {keyB64 && (
        <button disabled={status === 'working' || status === 'done'} onClick={handleDownload}>
          Scarica e decifra
        </button>
      )}

      {status === 'working' && <progress value={progress} max={1} />}
      {status === 'done' && <p>«{fileName}» decifrato e salvato.</p>}
      {status === 'error' && <p role="alert">{error}</p>}
    </main>
  );
}