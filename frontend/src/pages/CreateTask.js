import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['Design', 'Code', 'Writing', 'Data', 'Math', 'Research', 'Marketing', 'Video', 'Other'];
const SKILL_SUGGESTIONS = ['React', 'Node.js', 'Python', 'Figma', 'UI/UX', 'Writing', 'Data Analysis', 'SQL', 'Machine Learning', 'Illustrator', 'Content Writing', 'Research'];

const TaskForm = ({ editMode = false }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(editMode);
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', category: 'Code',
    budget: '', deadline: '', tags: '',
  });

  useEffect(() => {
    if (editMode && id) {
      api.get(`/tasks/${id}`).then(({ data }) => {
        const t = data.task;
        setForm({
          title: t.title, description: t.description,
          category: t.category, budget: t.budget,
          deadline: t.deadline?.split('T')[0] || '',
          tags: (t.tags || []).join(', '),
        });
        setSkills(t.requiredSkills || []);
      }).catch(() => toast.error('Task not found')).finally(() => setFetching(false));
    }
  }, [editMode, id]);

  const addSkill = (s) => {
    const sk = s.trim();
    if (sk && !skills.includes(sk) && skills.length < 10) setSkills(p => [...p, sk]);
    setSkillInput('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.budget || !form.deadline || !form.category) {
      toast.error('Please fill all required fields'); return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form, budget: Number(form.budget),
        requiredSkills: skills,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      };
      if (editMode) {
        await api.put(`/tasks/${id}`, payload);
        toast.success('Task updated!');
        navigate(`/tasks/${id}`);
      } else {
        const { data } = await api.post('/tasks', payload);
        toast.success('Task posted!');
        navigate(`/tasks/${data.task._id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    } finally { setLoading(false); }
  };

  if (fetching) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="page-container" style={{ maxWidth: 680 }}>
      <div className="page-header">
        <div className="page-title">{editMode ? 'Edit Task' : 'Post a New Task'}</div>
        <div className="page-subtitle">{editMode ? 'Update task details' : 'Describe what you need done and set your budget'}</div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Task Title *</label>
            <input placeholder="e.g. Design a logo for my debate club" value={form.title} required
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>

          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea placeholder="Describe the task in detail — deliverables, requirements, references..." value={form.description}
              required minLength={20} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              style={{ minHeight: 120 }} />
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{form.description.length} / 2000</div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Budget ($) *</label>
              <input type="number" placeholder="50" min="1" value={form.budget} required
                onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Deadline *</label>
            <input type="date" value={form.deadline} required
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
          </div>

          <div className="form-group">
            <label className="form-label">Required Skills</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input placeholder="Add a skill and press Enter" value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput); } }}
                style={{ flex: 1 }} />
              <button type="button" className="btn btn-secondary" onClick={() => addSkill(skillInput)}>Add</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {SKILL_SUGGESTIONS.filter(s => !skills.includes(s)).slice(0, 8).map(s => (
                <button key={s} type="button" onClick={() => addSkill(s)}
                  style={{ padding: '2px 10px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 20, fontSize: 11, color: 'var(--text2)', cursor: 'pointer' }}>
                  + {s}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {skills.map(s => (
                <span key={s} className="chip">
                  {s}
                  <span className="chip-remove" onClick={() => setSkills(p => p.filter(x => x !== s))}>×</span>
                </span>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Tags (comma separated)</label>
            <input placeholder="e.g. logo, branding, graphic" value={form.tags}
              onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
          </div>

          {/* Preview budget */}
          {form.budget && (
            <div style={{ background: 'var(--green-bg)', border: '1px solid rgba(45,212,160,0.2)', borderRadius: 8, padding: '12px 14px', marginBottom: 16, fontSize: 13 }}>
              💡 Your task will be posted with a budget of <strong style={{ color: 'var(--green)' }}>${form.budget}</strong>. Funds will be locked in escrow when you accept a bid.
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ flex: 1 }}>
              {loading ? 'Saving...' : editMode ? 'Update Task' : '🚀 Post Task'}
            </button>
            <button type="button" className="btn btn-secondary btn-lg" onClick={() => navigate(-1)}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const CreateTask = () => <TaskForm />;
export const EditTask = () => <TaskForm editMode />;

export default TaskForm;
