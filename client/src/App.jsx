import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Upload from './pages/Upload';
import Download from './pages/Download';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Upload />} />
        <Route path="/d/:id" element={<Download />} />
      </Routes>
    </BrowserRouter>
  );
}