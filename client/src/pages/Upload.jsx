import { useState } from 'react';
import { sendFile, MAX_FILE_SIZE } from '../transfer';
import { formatSize } from '../format';
import Shell from '../components/Shell';
import { SendExplainer } from '../components/Explainers';
import Progress from '../components/Progress';
import { UploadIcon, FileIcon, CloseIcon, CheckIcon } from '../components/Icons';

export default function Upload() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | working | done | error
  const [progress, setProgress] = useState(0);
  const [link, setLink] = useState('');
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [copied, setCopied] = useState(false);

  const tooBig = file && file.size > MAX_FILE_SIZE;
  const working = status === 'working';

  function pick(f) {
    setFile(f ?? null);
    setStatus('idle');
    setError('');
    setLink('');
    setCopied(false);
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
      setLink(await sendFile(file, setProgress));
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
    <Shell aside={<SendExplainer />}>
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
          {!working && status !== 'done' && (
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

      {status !== 'done' && (
        <button className="btn" disabled={!file || tooBig || working} onClick={handleSend}>
          {working ? 'Cifratura in corso…' : 'Cifra e invia'}
        </button>
      )}

      {working && <Progress value={progress} label="Cifratura e caricamento" />}

      {status === 'done' && (
        <section className="result">
          <p className="ok"><CheckIcon /> File cifrato e caricato</p>
          <p className="hint">
            Chi apre questo link può scaricare e decifrare il file. Il link scade tra 24 ore.
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
          <button className="btn btn-secondary" onClick={() => pick(null)}>Invia un altro file</button>
        </section>
      )}

      {error && <p className="alert" role="alert">{error}</p>}
    </Shell>
  );
}
