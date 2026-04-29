import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TaskList from './pages/TaskList';
import TaskDetail from './pages/TaskDetail';
import CreateTask from './pages/CreateTask';
import EditTask from './pages/EditTask';
import Profile from './pages/Profile';
import WalletPage from './pages/WalletPage';
import ChatPage from './pages/ChatPage';
import AdminPanel from './pages/AdminPanel';

// Layout
import Navbar from './components/common/Navbar';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  return user ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  return user ? <Navigate to="/dashboard" replace /> : children;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <>
      {user && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/tasks" element={<PrivateRoute><TaskList /></PrivateRoute>} />
        <Route path="/tasks/:id" element={<PrivateRoute><TaskDetail /></PrivateRoute>} />
        <Route path="/tasks/create" element={<PrivateRoute><CreateTask /></PrivateRoute>} />
        <Route path="/tasks/:id/edit" element={<PrivateRoute><EditTask /></PrivateRoute>} />
        <Route path="/profile/:id" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/wallet" element={<PrivateRoute><WalletPage /></PrivateRoute>} />
        <Route path="/chat" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
        <Route path="/chat/:userId" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <SocketProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1a1a28', color: '#eeeef8', border: '1px solid rgba(255,255,255,0.1)' },
            success: { iconTheme: { primary: '#2dd4a0', secondary: '#fff' } },
            error: { iconTheme: { primary: '#f56565', secondary: '#fff' } },
          }}
        />
      </SocketProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
