import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Login from './pages/Login';
import StudentUI from './pages/StudentUI';
import AdminUI from './pages/AdminUI';
import Navbar from './components/common/Navbar';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/student" element={
            <ProtectedRoute> <StudentUI /> </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute> <AdminUI /> </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;