import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['All', 'Design', 'Code', 'Writing', 'Data', 'Math', 'Research', 'Marketing', 'Video', 'Other'];
const SORTS = [{ value: '-createdAt', label: 'Newest' }, { value: 'budget', label: 'Budget: Low' }, { value: '-budget', label: 'Budget: High' }, { value: '-bidsCount', label: 'Most Bids' }];
const CAT_COLOR = { Design: 'badge-purple', Code: 'badge-green', Writing: 'badge-amber', Data: 'badge-blue', Math: 'badge-red', Research: 'badge-blue', Other: 'badge-purple' };

const TaskCard = ({ task }) => {
  const daysLeft = Math.ceil((new Date(task.deadline) - new Date()) / 86400000);
  const initials = task.createdBy?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  return (
    <Link to={`/tasks/${task._id}`} style={{ display: 'block' }}>
      <div className="card" style={{ cursor: 'pointer', transition: 'all 0.18s', height: '100%' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <span className={`badge ${CAT_COLOR[task.category] || 'badge-purple'}`}>{task.category}</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--green)' }}>${task.budget}</span>
        </div>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {task.title}
        </h3>
        <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>
          {task.description}
        </p>
        {task.requiredSkills?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
            {task.requiredSkills.slice(0, 3).map(s => (
              <span key={s} style={{ padding: '2px 8px', background: 'var(--amber-bg)', color: 'var(--amber)', borderRadius: 20, fontSize: 10, fontWeight: 500 }}>{s}</span>
            ))}
            {task.requiredSkills.length > 3 && <span style={{ fontSize: 10, color: 'var(--text3)' }}>+{task.requiredSkills.length - 3}</span>}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div className="avatar avatar-sm" style={{ width: 24, height: 24, fontSize: 9 }}>{initials}</div>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>{task.createdBy?.name}</span>
          </div>
          <div style={{ display: 'flex', gap: 10, fontSize: 11, color: 'var(--text3)' }}>
            <span>{task.bidsCount || 0} bids</span>
            <span style={{ color: daysLeft < 3 ? 'var(--red)' : daysLeft < 7 ? 'var(--amber)' : 'var(--text3)' }}>
              {daysLeft < 0 ? 'Expired' : `${daysLeft}d left`}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

const TaskList = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ category: '', minBudget: '', maxBudget: '', search: '', sort: '-createdAt', status: 'open' });
  const [activeCategory, setActiveCategory] = useState('All');

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12, ...filters };
      if (!params.category) delete params.category;
      if (!params.minBudget) delete params.minBudget;
      if (!params.maxBudget) delete params.maxBudget;
      if (!params.search) delete params.search;
      const { data } = await api.get('/tasks', { params });
      setTasks(data.tasks);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (e) {} finally { setLoading(false); }
  }, [filters, page]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const setCategory = (cat) => {
    setActiveCategory(cat);
    setFilters(f => ({ ...f, category: cat === 'All' ? '' : cat }));
    setPage(1);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="page-title">Browse Tasks</div>
          <div className="page-subtitle">{total} tasks available</div>
        </div>
        <Link to="/tasks/create" className="btn btn-primary">+ Post Task</Link>
      </div>

      {/* Search & Sort */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }}>🔍</span>
          <input placeholder="Search tasks by title or skill..." value={filters.search}
            onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1); }}
            style={{ paddingLeft: 36 }} />
        </div>
        <select value={filters.sort} onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))} style={{ width: 160 }}>
          {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <div style={{ display: 'flex', gap: 6 }}>
          <input type="number" placeholder="Min $" value={filters.minBudget} style={{ width: 80 }}
            onChange={e => { setFilters(f => ({ ...f, minBudget: e.target.value })); setPage(1); }} />
          <input type="number" placeholder="Max $" value={filters.maxBudget} style={{ width: 80 }}
            onChange={e => { setFilters(f => ({ ...f, maxBudget: e.target.value })); setPage(1); }} />
        </div>
      </div>

      {/* Category filters */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)}
            style={{
              padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, border: '1px solid',
              cursor: 'pointer', transition: 'all 0.15s',
              background: activeCategory === cat ? 'var(--accent)' : 'var(--bg3)',
              color: activeCategory === cat ? '#fff' : 'var(--text2)',
              borderColor: activeCategory === cat ? 'var(--accent)' : 'var(--border)',
            }}>{cat}</button>
        ))}
        <select value={filters.status} onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }}
          style={{ marginLeft: 'auto', width: 150, fontSize: 12, padding: '5px 10px' }}>
          <option value="open">Open Tasks</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="all">All Status</option>
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="loading-screen"><div className="spinner" /></div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3>No tasks found</h3>
          <p>Try adjusting your filters or <Link to="/tasks/create" style={{ color: 'var(--accent)' }}>post a task</Link></p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
          {tasks.map(task => <TaskCard key={task._id} task={task} />)}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 28 }}>
          <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
            <button key={p} className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button className="btn btn-secondary btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
};

export default TaskList;
