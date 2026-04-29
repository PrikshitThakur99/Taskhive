import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const SKILL_SUGGESTIONS = ['React', 'Node.js', 'Python', 'Figma', 'UI/UX', 'Writing', 'Data Analysis', 'SQL', 'Machine Learning', 'Illustrator', 'Content Writing', 'Research', 'Math'];

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', university: '', bio: '' });
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addSkill = (skill) => {
    const s = skill.trim();
    if (s && !skills.includes(s) && skills.length < 10) setSkills(p => [...p, s]);
    setSkillInput('');
  };

  const removeSkill = (s) => setSkills(p => p.filter(x => x !== s));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await register({ ...form, skills });
      toast.success('Welcome to TaskHive! 🎉 You got $100 welcome balance!');
      navigate('/dashboard');
    } catch (err) {
      if (!err.response) {
        setError('Cannot reach server. Is the backend running on port 5000?');
      } else {
        setError(err.response?.data?.message || 'Registration failed');
      }
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, background: 'var(--accent)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, color: '#fff' }}>T</div>
            <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.03em' }}>TaskHive</span>
          </Link>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Create your account</h1>
          <p style={{ color: 'var(--text2)', marginTop: 6, fontSize: 14 }}>Get $100 welcome balance — no credit card needed</p>
        </div>

        <div className="card">
          {error && (
            <div style={{ background: 'var(--red-bg)', border: '1px solid rgba(245,101,101,0.25)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--red)' }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input placeholder="Your name" value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">University</label>
                <input placeholder="MIT, Stanford..." value={form.university}
                  onChange={e => setForm(p => ({ ...p, university: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" placeholder="you@student.edu" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" placeholder="Min 6 characters" value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required minLength={6} />
            </div>
            <div className="form-group">
              <label className="form-label">Bio (optional)</label>
              <textarea placeholder="Tell others about yourself..." value={form.bio}
                onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} style={{ minHeight: 60 }} />
            </div>
            <div className="form-group">
              <label className="form-label">Your Skills</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                  placeholder="Type a skill and press Enter"
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput); } }}
                  style={{ flex: 1 }}
                />
                <button type="button" className="btn btn-secondary" onClick={() => addSkill(skillInput)}>Add</button>
              </div>
              {/* Suggestions */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {SKILL_SUGGESTIONS.filter(s => !skills.includes(s)).slice(0, 8).map(s => (
                  <button key={s} type="button" onClick={() => addSkill(s)}
                    style={{ padding: '2px 10px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 20, fontSize: 11, color: 'var(--text2)', cursor: 'pointer' }}>
                    + {s}
                  </button>
                ))}
              </div>
              {/* Selected */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {skills.map(s => (
                  <span key={s} className="chip">
                    {s}
                    <span className="chip-remove" onClick={() => removeSkill(s)}>×</span>
                  </span>
                ))}
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account →'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text2)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
