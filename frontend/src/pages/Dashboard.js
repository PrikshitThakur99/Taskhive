import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const STATUS_COLOR = { open: 'var(--green)', in_progress: 'var(--amber)', completed: 'var(--blue)', cancelled: 'var(--red)' };
const STATUS_LABEL = { open: 'Open', in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled' };

const Dashboard = () => {
  const { user, loadUser } = useAuth();
  const [myTasks, setMyTasks] = useState([]);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posted');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [tasksRes, assignedRes, bidsRes, recRes, walletRes] = 
    await Promise.all([
    api.get('/api/tasks/my?type=posted'),
    api.get('/api/tasks/my?type=assigned'),
    api.get('/api/bids/my'),
    api.get('/api/recommendations'),
    api.get('/api/wallet')  
        ]);
        setMyTasks(tasksRes.data.tasks);
        setAssignedTasks(assignedRes.data.tasks);
        setMyBids(bidsRes.data.bids);
        setRecommendations(recRes.data.recommendations);
        setWallet(walletRes.data);
      } catch (err) {
        toast.error('Failed to load dashboard');
      } finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const chartData = wallet?.monthlyData?.map(d => ({
    name: MONTHS[d._id.month - 1],
    earned: d.total,
  })) || [
    { name: 'Feb', earned: 0 }, { name: 'Mar', earned: 40 },
    { name: 'Apr', earned: 65 }, { name: 'May', earned: user?.totalEarned || 0 },
  ];

  const taskStatusData = [
    { name: 'Open', value: myTasks.filter(t => t.status === 'open').length, color: 'var(--green)' },
    { name: 'In Progress', value: myTasks.filter(t => t.status === 'in_progress').length, color: 'var(--amber)' },
    { name: 'Completed', value: myTasks.filter(t => t.status === 'completed').length, color: 'var(--blue)' },
  ].filter(d => d.value > 0);

  if (loading) return <div className="loading-screen"><div className="spinner" /><span>Loading dashboard...</span></div>;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="page-title">Hey, {user?.name?.split(' ')[0]} 👋</div>
          <div className="page-subtitle">Here's what's happening on your TaskHive</div>
        </div>
        <Link to="/tasks/create" className="btn btn-primary">+ Post New Task</Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Wallet Balance', value: `$${user?.walletBalance?.toFixed(2) || '0.00'}`, sub: `$${user?.escrowBalance?.toFixed(2) || '0'} in escrow`, color: 'var(--green)' },
          { label: 'Total Earned', value: `$${user?.totalEarned?.toFixed(2) || '0.00'}`, sub: 'Lifetime earnings', color: 'var(--blue)' },
          { label: 'Tasks Completed', value: user?.completedTasksCount || 0, sub: 'as freelancer', color: 'var(--accent)' },
          { label: 'Rating', value: user?.averageRating > 0 ? `${user.averageRating}★` : 'N/A', sub: `${user?.totalReviews || 0} reviews`, color: 'var(--amber)' },
          { label: 'Active Bids', value: myBids.filter(b => b.status === 'pending').length, sub: 'awaiting response', color: 'var(--red)' },
          { label: 'Posted Tasks', value: myTasks.length, sub: 'tasks created', color: 'var(--green)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color, fontSize: 22 }}>{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Earnings chart */}
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 14 }}>💰 Earnings Overview</div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="earnGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 12 }} formatter={v => [`$${v}`, 'Earned']} />
              <Area type="monotone" dataKey="earned" stroke="var(--accent)" fill="url(#earnGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Task status donut */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14, alignSelf: 'flex-start' }}>📊 Task Status</div>
          {taskStatusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={taskStatusData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value" paddingAngle={3}>
                    {taskStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
                {taskStatusData.map(d => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                    <span style={{ color: 'var(--text2)', flex: 1 }}>{d.name}</span>
                    <span style={{ fontWeight: 600 }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ color: 'var(--text3)', fontSize: 13, marginTop: 40 }}>No tasks yet</div>
          )}
        </div>
      </div>

      {/* Tasks & Bids */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* My Tasks */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>📋 My Posted Tasks</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {['posted','assigned'].map(t => (
                <button key={t} onClick={() => setActiveTab(t)} className={`btn btn-sm ${activeTab === t ? 'btn-primary' : 'btn-ghost'}`}>
                  {t === 'posted' ? 'Posted' : 'Working On'}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(activeTab === 'posted' ? myTasks : assignedTasks).slice(0, 5).map(task => (
              <Link key={task._id} to={`/tasks/${task._id}`} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 12px', background: 'var(--bg3)', borderRadius: 8,
                border: '1px solid var(--border)', transition: 'border-color 0.15s',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>${task.budget} · {task.bidsCount || 0} bids</div>
                </div>
                <span className="badge" style={{ background: 'transparent', color: STATUS_COLOR[task.status], border: `1px solid ${STATUS_COLOR[task.status]}30`, marginLeft: 8 }}>
                  {STATUS_LABEL[task.status]}
                </span>
              </Link>
            ))}
            {(activeTab === 'posted' ? myTasks : assignedTasks).length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text3)', fontSize: 13 }}>
                {activeTab === 'posted' ? 'No tasks posted yet' : 'No tasks assigned yet'}
              </div>
            )}
          </div>
        </div>

        {/* My Bids */}
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>🎯 My Bids</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {myBids.slice(0, 5).map(bid => (
              <Link key={bid._id} to={`/tasks/${bid.task?._id}`} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 12px', background: 'var(--bg3)', borderRadius: 8, border: '1px solid var(--border)',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {bid.task?.title || 'Task'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Your bid: ${bid.amount}</div>
                </div>
                <span className="badge" style={{
                  background: bid.status === 'accepted' ? 'var(--green-bg)' : bid.status === 'rejected' ? 'var(--red-bg)' : 'var(--amber-bg)',
                  color: bid.status === 'accepted' ? 'var(--green)' : bid.status === 'rejected' ? 'var(--red)' : 'var(--amber)',
                  border: 'none', marginLeft: 8,
                }}>
                  {bid.status}
                </span>
              </Link>
            ))}
            {myBids.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text3)', fontSize: 13 }}>No bids placed yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>✨ Recommended For You</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
            {recommendations.slice(0, 4).map(task => (
              <Link key={task._id} to={`/tasks/${task._id}`} style={{
                display: 'block', padding: 14, background: 'var(--bg3)', borderRadius: 10,
                border: '1px solid var(--border)', transition: 'all 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>{task.recommendationReason}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--green)' }}>${task.budget}</span>
                  <span className="badge badge-purple" style={{ fontSize: 10 }}>{task.category}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
