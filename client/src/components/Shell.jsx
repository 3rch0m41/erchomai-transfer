import { Link } from 'react-router-dom';
import { ShieldIcon } from './Icons';

// Mobile: una colonna (pannello, poi spiegazione).
// Desktop: spiegazione a sinistra, pannello d'azione a destra.
export default function Shell({ children, aside }) {
  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand">
          <ShieldIcon />
          <span>Erchomai Transfer</span>
        </Link>
        <nav className="topnav">
          <Link to="/">Invia un file</Link>
        </nav>
      </header>

      <div className="layout">
        <main className="panel">{children}</main>
        {aside && <aside className="aside">{aside}</aside>}
      </div>

      <footer className="foot">
        Cifratura end-to-end AES-GCM nel browser. Il server non vede mai la chiave.
      </footer>
    </div>
  );
}
