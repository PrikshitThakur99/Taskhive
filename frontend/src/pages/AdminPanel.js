import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../utils/api';
import toast from 'react-hot-toast';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const AdminPanel = () => {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [taskStatus, setTaskStatus] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [taskPage, setTaskPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);

  useEffect(() => {
    api.get('/admin/stats').then(({ data }) => setStats(data)).catch(() => toast.error('Failed to load stats')).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab === 'users') {
      api.get('/admin/users', { params: { page: userPage, limit: 15, search: userSearch } })
        .then(({ data }) => { setUsers(data.users); setTotalUsers(data.total); })
        .catch(() => toast.error('Failed to load users'));
    }
  }, [tab, userPage, userSearch]);

  useEffect(() => {
    if (tab === 'tasks') {
      api.get('/admin/tasks', { params: { page: taskPage, limit: 15, status: taskStatus || undefined } })
        .then(({ data }) => { setTasks(data.tasks); setTotalTasks(data.total); })
        .catch(() => toast.error('Failed to load tasks'));
    }
  }, [tab, taskPage, taskStatus]);

  useEffect(() => {
    if (tab === 'transactions') {
      api.get('/admin/transactions', { params: { limit: 50 } })
        .then(({ data }) => setTransactions(data.transactions))
        .catch(() => toast.error('Failed to load transactions'));
    }
  }, [tab]);

  const handleBan = async (userId, banned) => {
    try {
      const { data } = await api.patch(`/admin/users/${userId}/ban`);
      toast.success(data.message);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isBanned: !banned } : u));
    } catch { toast.error('Failed'); }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task permanently?')) return;
    try {
      await api.delete(`/admin/tasks/${taskId}`);
      toast.success('Task deleted');
      setTasks(prev => prev.filter(t => t._id !== taskId));
    } catch { toast.error('Failed'); }
  };

  const signupChartData = stats?.monthlySignups?.map(d => ({
    month: MONTHS[d._id.month - 1], users: d.count,
  })) || [];

  const taskChartData = stats?.monthlyTasks?.map(d => ({
    month: MONTHS[d._id.month - 1], tasks: d.count,
  })) || [];

  const TABS = ['overview', 'users', 'tasks', 'transactions'];

  if (loading) return <div className="loading-screen"><div className="spinner" /><span>Loading admin panel...</span></div>;

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="page-title">🛡️ Admin Panel</div>
          <div className="page-subtitle">Platform management & monitoring</div>
        </div>
        <span className="badge badge-red" style={{ fontSize: 12, padding: '6px 14px' }}>Admin Access</span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 18px', fontSize: 13, fontWeight: 500, border: 'none',
            background: 'transparent', cursor: 'pointer', textTransform: 'capitalize',
            color: tab === t ? 'var(--accent)' : 'var(--text2)',
            borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
            transition: 'all 0.15s',
          }}>{t}</button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === 'overview' && stats && (
        <div>
          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Total Students', value: stats.stats.totalUsers, color: 'var(--accent)' },
              { label: 'Total Tasks', value: stats.stats.totalTasks, color: 'var(--blue)' },
              { label: 'Completed', value: stats.stats.completedTasks, color: 'var(--green)' },
              { label: 'In Progress', value: stats.stats.activeTasks, color: 'var(--amber)' },
              { label: 'Revenue', value: `$${stats.stats.totalRevenue?.toFixed(0) || 0}`, color: 'var(--green)' },
              { label: 'Transactions', value: stats.stats.totalTransactions, color: 'var(--blue)' },
              { label: 'Banned Users', value: stats.stats.bannedUsers, color: 'var(--red)' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ color: s.color, fontSize: 22 }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="card">
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14 }}>👥 Monthly Signups</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={signupChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} />
                  <YAxis tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 12 }} />
                  <Line type="monotone" dataKey="users" stroke="var(--accent)" strokeWidth={2} dot={{ fill: 'var(--accent)', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14 }}>📋 Monthly Tasks Posted</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={taskChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} />
                  <YAxis tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="tasks" fill="var(--blue)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* USERS */}
      {tab === 'users' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <input placeholder="Search users by name or email..." value={userSearch}
              onChange={e => { setUserSearch(e.target.value); setUserPage(1); }}
              style={{ flex: 1 }} />
            <span style={{ color: 'var(--text2)', fontSize: 13, padding: '10px 0' }}>{totalUsers} users</span>
          </div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
                  {['User', 'University', 'Joined', 'Balance', 'Tasks Done', 'Rating', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u._id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="avatar" style={{ width: 28, height: 28, fontSize: 10, flexShrink: 0 }}>{u.name?.slice(0,2).toUpperCase()}</div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{u.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text2)' }}>{u.university || '-'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text3)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>${u.walletBalance?.toFixed(2)}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13 }}>{u.completedTasksCount}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--amber)' }}>
                      {u.averageRating > 0 ? `${u.averageRating}★` : '-'}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                        background: u.isBanned ? 'var(--red-bg)' : u.role === 'admin' ? 'var(--accent-glow)' : 'var(--green-bg)',
                        color: u.isBanned ? 'var(--red)' : u.role === 'admin' ? 'var(--accent)' : 'var(--green)',
                      }}>
                        {u.isBanned ? 'Banned' : u.role === 'admin' ? 'Admin' : 'Active'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Link to={`/profile/${u._id}`} className="btn btn-ghost btn-sm" style={{ fontSize: 11 }}>View</Link>
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleBan(u._id, u.isBanned)}
                            className={`btn btn-sm ${u.isBanned ? 'btn-success' : 'btn-danger'}`}
                            style={{ fontSize: 11 }}
                          >{u.isBanned ? 'Unban' : 'Ban'}</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
            <button className="btn btn-secondary btn-sm" disabled={userPage === 1} onClick={() => setUserPage(p => p - 1)}>← Prev</button>
            <span style={{ padding: '6px 12px', fontSize: 13, color: 'var(--text2)' }}>Page {userPage} of {Math.ceil(totalUsers / 15)}</span>
            <button className="btn btn-secondary btn-sm" disabled={userPage * 15 >= totalUsers} onClick={() => setUserPage(p => p + 1)}>Next →</button>
          </div>
        </div>
      )}

      {/* TASKS */}
      {tab === 'tasks' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <select value={taskStatus} onChange={e => { setTaskStatus(e.target.value); setTaskPage(1); }} style={{ width: 200 }}>
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <span style={{ color: 'var(--text2)', fontSize: 13, padding: '10px 0' }}>{totalTasks} tasks</span>
          </div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
                  {['Title', 'Category', 'Budget', 'Posted By', 'Status', 'Created', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tasks.map((t, i) => {
                  const STATUS_COLOR = { open: 'var(--green)', in_progress: 'var(--amber)', completed: 'var(--blue)', cancelled: 'var(--red)' };
                  const STATUS_BG = { open: 'var(--green-bg)', in_progress: 'var(--amber-bg)', completed: 'var(--blue-bg)', cancelled: 'var(--red-bg)' };
                  return (
                    <tr key={t._id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <Link to={`/tasks/${t._id}`} style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', maxWidth: 220, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.title}
                        </Link>
                      </td>
                      <td style={{ padding: '10px 14px' }}><span className="badge badge-purple" style={{ fontSize: 10 }}>{t.category}</span></td>
                      <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>${t.budget}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text2)' }}>{t.createdBy?.name || '-'}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: STATUS_BG[t.status], color: STATUS_COLOR[t.status] }}>
                          {t.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text3)' }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Link to={`/tasks/${t._id}`} className="btn btn-ghost btn-sm" style={{ fontSize: 11 }}>View</Link>
                          <button onClick={() => handleDeleteTask(t._id)} className="btn btn-danger btn-sm" style={{ fontSize: 11 }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
            <button className="btn btn-secondary btn-sm" disabled={taskPage === 1} onClick={() => setTaskPage(p => p - 1)}>← Prev</button>
            <span style={{ padding: '6px 12px', fontSize: 13, color: 'var(--text2)' }}>Page {taskPage} of {Math.ceil(totalTasks / 15)}</span>
            <button className="btn btn-secondary btn-sm" disabled={taskPage * 15 >= totalTasks} onClick={() => setTaskPage(p => p + 1)}>Next →</button>
          </div>
        </div>
      )}

      {/* TRANSACTIONS */}
      {tab === 'transactions' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
                {['Reference', 'User', 'Type', 'Amount', 'Description', 'Date'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, i) => {
                const isCredit = ['credit', 'deposit', 'refund', 'escrow_release'].includes(tx.type);
                return (
                  <tr key={tx._id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                    <td style={{ padding: '10px 14px', fontSize: 11, color: 'var(--text3)', fontFamily: 'monospace' }}>{tx.reference}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12 }}>{tx.user?.name || '-'}<div style={{ fontSize: 10, color: 'var(--text3)' }}>{tx.user?.email}</div></td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                        background: isCredit ? 'var(--green-bg)' : 'var(--amber-bg)',
                        color: isCredit ? 'var(--green)' : 'var(--amber)',
                      }}>{tx.type.replace('_', ' ')}</span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, color: isCredit ? 'var(--green)' : 'var(--red)' }}>
                      {isCredit ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text2)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text3)' }}>{new Date(tx.createdAt).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
