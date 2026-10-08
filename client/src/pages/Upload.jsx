import { useState } from 'react';
import { sendFile, MAX_FILE_SIZE, MIN_PASSWORD_LENGTH } from '../transfer';
import { formatSize } from '../format';
import Shell from '../components/Shell';
import { SendExplainer } from '../components/Explainers';
import Progress from '../components/Progress';
import PasswordField from '../components/PasswordField';
import { UploadIcon, FileIcon, CloseIcon, CheckIcon, LockIcon } from '../components/Icons';

export default function Upload() {
  const [file, setFile] = useState(null);
  const [protect, setProtect] = useState(false);
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle'); // idle | working | done | error
  const [progress, setProgress] = useState(0);
  const [link, setLink] = useState('');
  const [usedPassword, setUsedPassword] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [copied, setCopied] = useState(false);

  const tooBig = file && file.size > MAX_FILE_SIZE;
  const working = status === 'working';
  const done = status === 'done';
  const passwordTooShort = password.length > 0 && password.length < MIN_PASSWORD_LENGTH;
  const passwordMissing = protect && password.length === 0;

  function pick(f) {
    setFile(f ?? null);
    setStatus('idle');
    setError('');
    setLink('');
    setCopied(false);
  }

  function reset() {
    pick(null);
    setProtect(false);
    setPassword('');
    setUsedPassword(false);
  }

  function toggleProtect(on) {
    setProtect(on);
    if (!on) setPassword('');
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    pick(e.dataTransfer.files[0]);
  }

  async function handleSend() {
    setStatus('working');
    setError('');
    setProgress(0);
    try {
      const pw = protect ? password : '';
      setLink(await sendFile(file, pw, setProgress));
      setUsedPassword(Boolean(pw));
      setPassword('');
      setStatus('done');
    } catch (e) {
      setError(e.message);
      setStatus('error');
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Copia non riuscita: seleziona il link e copialo a mano.');
    }
  }

  return (
    <Shell aside={<SendExplainer withPassword={protect || usedPassword} />}>
      <h1>Invia un file</h1>
      <p className="lead">Il file viene cifrato nel tuo browser prima di lasciare il dispositivo.</p>

      {!file ? (
        <label
          className={`dropzone${dragOver ? ' is-dragover' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <input type="file" onChange={(e) => pick(e.target.files[0])} />
          <div>
            <UploadIcon className="icon" />
            <strong>Trascina qui il file</strong>
            <small>oppure fai clic per sceglierlo</small>
          </div>
        </label>
      ) : (
        <div className="file">
          <div className="file-badge"><FileIcon /></div>
          <div className="file-meta">
            <div className="file-name" title={file.name}>{file.name}</div>
            <div className="file-size">{formatSize(file.size)}</div>
          </div>
          {!working && !done && (
            <button className="icon-btn" onClick={() => pick(null)} aria-label="Rimuovi file">
              <CloseIcon />
            </button>
          )}
        </div>
      )}

      {!file && <p className="hint field-hint">Dimensione massima {formatSize(MAX_FILE_SIZE)}.</p>}

      {tooBig && (
        <p className="alert" role="alert">
          Il file supera il limite di {formatSize(MAX_FILE_SIZE)}. Scegline uno più piccolo.
        </p>
      )}

      {!done && (
        <div className="protect">
          <label className="switch">
            <input
              type="checkbox"
              role="switch"
              checked={protect}
              onChange={(e) => toggleProtect(e.target.checked)}
              disabled={working}
            />
            <span className="switch-track" aria-hidden="true" />
            <span className="switch-text">
              <strong>Proteggi con una password</strong>
              <small>Senza la password, il link da solo non basta ad aprire il file.</small>
            </span>
          </label>

          {protect && (
            <>
              <PasswordField
                id="pw-send"
                label="Password"
                value={password}
                onChange={setPassword}
                autoComplete="new-password"
                autoFocus
                invalid={passwordTooShort}
                describedBy="pw-send-hint"
                disabled={working}
              />
              <p id="pw-send-hint" className={`hint field-hint${passwordTooShort ? ' is-error' : ''}`}>
                {passwordTooShort
                  ? `Ancora ${MIN_PASSWORD_LENGTH - password.length} caratteri: ne servono almeno ${MIN_PASSWORD_LENGTH}.`
                  : `Almeno ${MIN_PASSWORD_LENGTH} caratteri. Non viene salvata né inserita nel link.`}
              </p>
            </>
          )}
        </div>
      )}

      {!done && (
        <button
          className="btn"
          disabled={!file || tooBig || working || passwordMissing || passwordTooShort}
          onClick={handleSend}
        >
          {working ? 'Cifratura in corso…' : 'Cifra e invia'}
        </button>
      )}

      {working && (
        <Progress
          value={progress}
          label={usedPassword || protect ? 'Derivazione chiavi, cifratura e caricamento' : 'Cifratura e caricamento'}
        />
      )}

      {done && (
        <section className="result">
          <p className="ok"><CheckIcon /> File cifrato e caricato</p>
          <p className="hint">
            {usedPassword
              ? 'Per aprire il file servono il link e la password. Il link scade tra 24 ore.'
              : 'Chi apre questo link può scaricare e decifrare il file. Il link scade tra 24 ore.'}
          </p>
          <div className="link-field">
            <input
              readOnly
              value={link}
              onFocus={(e) => e.target.select()}
              aria-label="Link di download"
            />
            <button className="btn" onClick={handleCopy}>{copied ? 'Copiato' : 'Copia link'}</button>
          </div>
          {usedPassword && (
            <p className="note">
              <LockIcon />
              <span>Comunica la password al destinatario su un canale diverso da quello del link.</span>
            </p>
          )}
          <button className="btn btn-secondary" onClick={reset}>Invia un altro file</button>
        </section>
      )}

      {error && <p className="alert" role="alert">{error}</p>}
    </Shell>
  );
}
