import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { receiveFile, saveBlob, fragmentNeedsPassword } from '../transfer';

export default function Download() {
  const { id } = useParams();
  const [fragment] = useState(() => window.location.hash.slice(1));
  const needsPassword = fragmentNeedsPassword(fragment);
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState(fragment ? 'idle' : 'error');
  const [error, setError] = useState(fragment ? '' : 'Link incompleto: manca la chiave dopo il simbolo #.');
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState('');

  // Rimuove il segreto dalla barra degli indirizzi dopo averlo letto
  useEffect(() => {
    if (window.location.hash) history.replaceState(null, '', window.location.pathname);
  }, []);

  async function handleDownload() {
    setStatus('working');
    setError('');
    setProgress(0);
    try {
      const { blob, name } = await receiveFile(id, fragment, password, setProgress);
      saveBlob(blob, name);
      setFileName(name);
      setPassword('');
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

      {fragment && needsPassword && status !== 'done' && (
        <label>
          Password
          <input
            type="password"
            autoComplete="off"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
      )}

      {fragment && (
        <button
          disabled={status === 'working' || status === 'done' || (needsPassword && !password)}
          onClick={handleDownload}
        >
          Scarica e decifra
        </button>
      )}

      {status === 'working' && <progress value={progress} max={1} />}
      {status === 'done' && <p>«{fileName}» decifrato e salvato.</p>}
      {status === 'error' && <p role="alert">{error}</p>}
    </main>
  );
}