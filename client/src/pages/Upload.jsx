import { useState } from 'react';
import { sendFile } from '../transfer';

export default function Upload() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | working | done | error
  const [progress, setProgress] = useState(0);
  const [link, setLink] = useState('');
  const [error, setError] = useState('');

  async function handleSend() {
    setStatus('working');
    setError('');
    setProgress(0);
    try {
      setLink(await sendFile(file, setProgress));
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
      <button disabled={!file || status === 'working'} onClick={handleSend}>Cifra e invia</button>

      {status === 'working' && <progress value={progress} max={1} />}

      {status === 'done' && (
        <section>
          <p>Condividi questo link. Scade tra 24 ore.</p>
          <input readOnly value={link} onFocus={(e) => e.target.select()} size={60} />
          <button onClick={() => navigator.clipboard.writeText(link)}>Copia</button>
        </section>
      )}

      {status === 'error' && <p role="alert">{error}</p>}
    </main>
  );
}