import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      if (!err.response) {
        setError('Cannot reach server. Is the backend running on port 5000?');
      } else {
        setError(err.response?.data?.message || 'Login failed');
      }
    } finally { setLoading(false); }
  };

  const fillDemo = (email, pass) => setForm({ email, password: pass });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <div style={{ width: 36, height: 36, background: 'var(--accent)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, color: '#fff' }}>T</div>
            <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.03em' }}>TaskHive</span>
          </Link>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Welcome back</h1>
          <p style={{ color: 'var(--text2)', marginTop: 6, fontSize: 14 }}>Sign in to your account</p>
        </div>

        <div className="card">
          {error && (
            <div style={{ background: 'var(--red-bg)', border: '1px solid rgba(245,101,101,0.25)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--red)' }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" placeholder="you@student.edu" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" placeholder="••••••••" value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
            </div>
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          <div className="divider" />

          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Demo accounts</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { label: '👤 Student — Alex Kim', email: 'alex@student.edu', pass: 'password123' },
              { label: '🎨 Student — Sara Patel', email: 'sara@student.edu', pass: 'password123' },
              { label: '🔑 Admin', email: 'admin@taskhive.com', pass: 'Admin@123456' },
            ].map(d => (
              <button key={d.email} onClick={() => fillDemo(d.email, d.pass)} className="btn btn-ghost btn-sm" style={{ textAlign: 'left', justifyContent: 'flex-start' }}>
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text2)' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign up free</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
