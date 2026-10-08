import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { receiveFile, saveBlob, fragmentNeedsPassword } from '../transfer';
import Shell from '../components/Shell';
import { ReceiveExplainer } from '../components/Explainers';
import Progress from '../components/Progress';
import PasswordField from '../components/PasswordField';
import { LockIcon, CheckIcon } from '../components/Icons';

export default function Download() {
  const { id } = useParams();
  const [fragment] = useState(() => window.location.hash.slice(1));
  const needsPassword = fragmentNeedsPassword(fragment);
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState(fragment ? 'idle' : 'error');
  const [error, setError] = useState(fragment ? '' : 'Link incompleto: manca la chiave dopo il simbolo #.');
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState('');

  const working = status === 'working';
  const done = status === 'done';

  // Rimuove il segreto dalla barra degli indirizzi dopo averlo letto
  useEffect(() => {
    if (window.location.hash) history.replaceState(null, '', window.location.pathname);
  }, []);

  async function handleDownload(e) {
    e?.preventDefault();
    if (working || done || (needsPassword && !password)) return;
    setStatus('working');
    setError('');
    setProgress(0);
    try {
      const { blob, name } = await receiveFile(id, fragment, password, setProgress);
      saveBlob(blob, name);
      setFileName(name);
      setPassword('');
      setStatus('done');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }

  let subtitle = 'Il nome compare dopo la decifratura';
  if (needsPassword) subtitle = 'Protetto da password';
  if (done) subtitle = 'Decifrato e salvato';

  return (
    <Shell aside={<ReceiveExplainer needsPassword={needsPassword} />}>
      <h1>Hai ricevuto un file</h1>
      <p className="lead">
        {needsPassword
          ? 'Il file è cifrato end-to-end e protetto da una password che il mittente ti ha dato a parte.'
          : 'Il file è cifrato end-to-end. Verrà scaricato e decifrato qui, nel tuo browser.'}
      </p>

      <div className="file">
        <div className="file-badge"><LockIcon /></div>
        <div className="file-meta">
          <div className="file-name">{done ? fileName : 'File cifrato'}</div>
          <div className="file-size">{subtitle}</div>
        </div>
      </div>

      {fragment && !done && (
        // Un form solo per far funzionare Invio nel campo password; l'invio vero è gestito in JS
        <form onSubmit={handleDownload} noValidate>
          {needsPassword && (
            <PasswordField
              id="pw-receive"
              label="Password"
              value={password}
              onChange={(v) => { setPassword(v); if (status === 'error') setError(''); }}
              autoComplete="off"
              autoFocus
              invalid={status === 'error' && Boolean(error)}
              disabled={working}
            />
          )}
          <button type="submit" className="btn" disabled={working || (needsPassword && !password)}>
            {working ? 'Decifratura in corso…' : 'Scarica e decifra'}
          </button>
        </form>
      )}

      {working && <Progress value={progress} label={needsPassword ? 'Verifica password e download' : 'Download e verifica'} />}

      {done && (
        <section className="result">
          <p className="ok"><CheckIcon /> Integrità verificata</p>
          <p className="hint">Trovi «{fileName}» nella cartella dei download.</p>
        </section>
      )}

      {status === 'error' && error && <p className="alert" role="alert">{error}</p>}
    </Shell>
  );
}
