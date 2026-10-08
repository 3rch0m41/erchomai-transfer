import { useState } from 'react';
import { sendFile, MIN_PASSWORD_LENGTH } from '../transfer';

export default function Upload() {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle'); // idle | working | done | error
  const [progress, setProgress] = useState(0);
  const [link, setLink] = useState('');
  const [usedPassword, setUsedPassword] = useState(false);
  const [error, setError] = useState('');

  const passwordTooShort = password.length > 0 && password.length < MIN_PASSWORD_LENGTH;

  async function handleSend() {
    setStatus('working');
    setError('');
    setProgress(0);
    try {
      setLink(await sendFile(file, password, setProgress));
      setUsedPassword(Boolean(password));
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
      <p>Il file viene cifrato nel tuo browser prima di lasciare il dispositivo.</p>

      <input type="file" onChange={(e) => { setFile(e.target.files[0] ?? null); setStatus('idle'); }} />

      <label>
        Password (facoltativa)
        <input
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {passwordTooShort && <p>La password deve avere almeno {MIN_PASSWORD_LENGTH} caratteri.</p>}

      <button disabled={!file || status === 'working' || passwordTooShort} onClick={handleSend}>
        Cifra e invia
      </button>

      {status === 'working' && <progress value={progress} max={1} />}

      {status === 'done' && (
        <section>
          <p>Condividi questo link. Scade tra 24 ore.</p>
          <input readOnly value={link} onFocus={(e) => e.target.select()} size={60} />
          <button onClick={() => navigator.clipboard.writeText(link)}>Copia</button>
          {usedPassword && (
            <p>Comunica la password al destinatario su un canale diverso da quello del link.</p>
          )}
        </section>
      )}

      {status === 'error' && <p role="alert">{error}</p>}
    </main>
  );
}