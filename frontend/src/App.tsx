import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Notes from './pages/Notes';
import NoteDetail from './pages/NoteDetail';
import CreateNote from './pages/CreateNote';
import WorkerStatus from './pages/WorkerStatus';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/notes/new" element={<CreateNote />} />
        <Route path="/notes/:id" element={<NoteDetail />} />
        <Route path="/worker" element={<WorkerStatus />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
