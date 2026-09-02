import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout';
import { Dashboard, DebtAnalysis, Simulation, AiFeedback, AiReport, Login, Signup } from './pages';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/debt-analysis" element={<DebtAnalysis />} />
          <Route path="/simulation" element={<Simulation />} />
          <Route path="/ai-feedback" element={<AiFeedback />} />
          <Route path="/ai-report" element={<AiReport />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
