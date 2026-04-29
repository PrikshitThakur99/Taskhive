import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const Stars = ({ rating }) => '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));

const TaskDetail = () => {
  const { id } = useParams();
  const { user, loadUser } = useAuth();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bidForm, setBidForm] = useState({ amount: '', message: '', deliveryDays: 3 });
  const [submitting, setSubmitting] = useState(false);
  const [showBidForm, setShowBidForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [completing, setCompleting] = useState(false);

  const fetchTask = async () => {
    try {
      const { data } = await api.get(`/tasks/${id}`);
      setTask(data.task);
      setBids(data.bids);
    } catch { toast.error('Task not found'); navigate('/tasks'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTask(); }, [id]);

  const isOwner = user?._id === task?.createdBy?._id;
  const isWorker = user?._id === task?.assignedTo?._id;
  const myBid = bids.find(b => b.bidder?._id === user?._id);
  const daysLeft = task ? Math.ceil((new Date(task.deadline) - new Date()) / 86400000) : 0;

  const handleBid = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/bids', { taskId: task._id, ...bidForm });
      toast.success('Bid submitted!');
      setShowBidForm(false);
      fetchTask();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to submit bid'); }
    finally { setSubmitting(false); }
  };

  const handleAcceptBid = async (bidId) => {
    if (!window.confirm('Accept this bid? Funds will be locked in escrow.')) return;
    try {
      const { data } = await api.patch(`/bids/${bidId}/accept`);
      toast.success(data.message);
      fetchTask(); loadUser();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleComplete = async () => {
    if (!window.confirm('Mark as complete and release payment?')) return;
    setCompleting(true);
    try {
      const { data } = await api.patch(`/tasks/${task._id}/complete`);
      toast.success(data.message);
      fetchTask(); loadUser();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setCompleting(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this task? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await api.delete(`/tasks/${task._id}`);
      toast.success('Task deleted');
      navigate('/tasks');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setDeleting(false); }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    try {
      await api.post('/reviews', { taskId: task._id, ...reviewForm });
      toast.success('Review submitted!');
      setShowReviewForm(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleWithdrawBid = async () => {
    if (!myBid) return;
    try {
      await api.delete(`/bids/${myBid._id}`);
      toast.success('Bid withdrawn');
      fetchTask();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel this task?')) return;
    try {
      await api.patch(`/tasks/${task._id}/cancel`);
      toast.success('Task cancelled'); fetchTask(); loadUser();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!task) return null;

  const STATUS_COLOR = { open: 'var(--green)', in_progress: 'var(--amber)', completed: 'var(--blue)', cancelled: 'var(--red)' };
  const STATUS_BG = { open: 'var(--green-bg)', in_progress: 'var(--amber-bg)', completed: 'var(--blue-bg)', cancelled: 'var(--red-bg)' };

  return (
    <div className="page-container" style={{ maxWidth: 900 }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>
        <Link to="/tasks" style={{ color: 'var(--accent)' }}>Tasks</Link> → {task.title.slice(0, 40)}...
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        {/* Main */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            {/* Status & category */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: STATUS_BG[task.status], color: STATUS_COLOR[task.status] }}>
                ● {task.status.replace('_', ' ').toUpperCase()}
              </span>
              <span className="badge badge-purple">{task.category}</span>
            </div>

            <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 12, lineHeight: 1.3 }}>{task.title}</h1>

            <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 16 }}>{task.description}</p>

            {task.requiredSkills?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Required Skills</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {task.requiredSkills.map(s => <span key={s} style={{ padding: '4px 10px', background: 'var(--amber-bg)', color: 'var(--amber)', borderRadius: 20, fontSize: 11, fontWeight: 500 }}>{s}</span>)}
                </div>
              </div>
            )}

            {/* Meta grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              {[
                { label: 'Budget', value: `$${task.budget}`, color: 'var(--green)' },
                { label: 'Deadline', value: new Date(task.deadline).toLocaleDateString(), color: daysLeft < 3 ? 'var(--red)' : 'var(--text)' },
                { label: 'Days Left', value: daysLeft < 0 ? 'Expired' : `${daysLeft} days`, color: daysLeft < 3 ? 'var(--red)' : 'var(--text)' },
              ].map(m => (
                <div key={m.label}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: m.color }}>{m.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          {isOwner && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>Task Owner Actions</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {task.status === 'open' && <Link to={`/tasks/${task._id}/edit`} className="btn btn-secondary btn-sm">✏️ Edit Task</Link>}
                {task.status === 'in_progress' && (
                  <button className="btn btn-success btn-sm" onClick={handleComplete} disabled={completing}>
                    {completing ? 'Releasing...' : '✅ Mark Complete & Release $' + task.acceptedAmount}
                  </button>
                )}
                {task.status === 'completed' && !showReviewForm && (
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowReviewForm(true)}>⭐ Leave Review</button>
                )}
                {['open', 'in_progress'].includes(task.status) && (
                  <button className="btn btn-danger btn-sm" onClick={handleCancel}>Cancel Task</button>
                )}
                {task.status === 'open' && (
                  <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting}>{deleting ? 'Deleting...' : '🗑️ Delete'}</button>
                )}
              </div>
              {showReviewForm && (
                <form onSubmit={handleReview} style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                  <div className="form-group">
                    <label className="form-label">Rating</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {[1,2,3,4,5].map(r => (
                        <button key={r} type="button" onClick={() => setReviewForm(f => ({ ...f, rating: r }))}
                          style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid', cursor: 'pointer', fontSize: 13,
                            background: reviewForm.rating >= r ? 'var(--amber-bg)' : 'var(--bg3)',
                            color: reviewForm.rating >= r ? 'var(--amber)' : 'var(--text2)',
                            borderColor: reviewForm.rating >= r ? 'var(--amber)' : 'var(--border)' }}>★ {r}</button>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Comment</label>
                    <textarea placeholder="Write your review..." value={reviewForm.comment} required minLength={10}
                      onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="submit" className="btn btn-primary btn-sm">Submit Review</button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowReviewForm(false)}>Cancel</button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Worker actions */}
          {isWorker && task.status === 'completed' && (
            <div className="card" style={{ marginBottom: 16 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowReviewForm(true)}>⭐ Review Client</button>
              {showReviewForm && (
                <form onSubmit={handleReview} style={{ marginTop: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Rating</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {[1,2,3,4,5].map(r => (
                        <button key={r} type="button" onClick={() => setReviewForm(f => ({ ...f, rating: r }))}
                          style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid', cursor: 'pointer', fontSize: 13,
                            background: reviewForm.rating >= r ? 'var(--amber-bg)' : 'var(--bg3)',
                            color: reviewForm.rating >= r ? 'var(--amber)' : 'var(--text2)',
                            borderColor: reviewForm.rating >= r ? 'var(--amber)' : 'var(--border)' }}>★ {r}</button>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Comment</label>
                    <textarea placeholder="Review the client..." value={reviewForm.comment} required minLength={10}
                      onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))} />
                  </div>
                  <button type="submit" className="btn btn-primary btn-sm">Submit Review</button>
                </form>
              )}
            </div>
          )}

          {/* Bids section */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Bids ({bids.length})</div>
              {!isOwner && task.status === 'open' && !myBid && (
                <button className="btn btn-primary btn-sm" onClick={() => setShowBidForm(!showBidForm)}>
                  {showBidForm ? 'Cancel' : '+ Place Bid'}
                </button>
              )}
              {myBid && myBid.status === 'pending' && (
                <button className="btn btn-danger btn-sm" onClick={handleWithdrawBid}>Withdraw Bid</button>
              )}
            </div>

            {/* Bid form */}
            {showBidForm && (
              <form onSubmit={handleBid} style={{ background: 'var(--bg3)', borderRadius: 10, padding: 16, marginBottom: 16, border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>Your Proposal</div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Bid Amount ($)</label>
                    <input type="number" placeholder={task.budget} min="1" value={bidForm.amount} required
                      onChange={e => setBidForm(f => ({ ...f, amount: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Delivery (days)</label>
                    <input type="number" min="1" max="365" value={bidForm.deliveryDays}
                      onChange={e => setBidForm(f => ({ ...f, deliveryDays: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Proposal Message</label>
                  <textarea placeholder="Describe your approach, experience, and why you're the best fit..." required minLength={10}
                    value={bidForm.message} onChange={e => setBidForm(f => ({ ...f, message: e.target.value }))} />
                </div>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Bid'}</button>
              </form>
            )}

            {/* Bid list */}
            {bids.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text3)', fontSize: 13 }}>
                No bids yet — be the first!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {bids.map(bid => (
                  <div key={bid._id} style={{
                    padding: 14, background: bid.status === 'accepted' ? 'rgba(45,212,160,0.05)' : 'var(--bg3)',
                    borderRadius: 10, border: `1px solid ${bid.status === 'accepted' ? 'rgba(45,212,160,0.3)' : 'var(--border)'}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <Link to={`/profile/${bid.bidder?._id}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="avatar avatar-sm">{bid.bidder?.name?.slice(0, 2).toUpperCase()}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{bid.bidder?.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                            {bid.bidder?.averageRating > 0 ? `${bid.bidder.averageRating}★` : 'New'} · {bid.bidder?.completedTasksCount || 0} tasks done
                          </div>
                        </div>
                      </Link>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--green)' }}>${bid.amount}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{bid.deliveryDays}d delivery</div>
                      </div>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 10 }}>{bid.message}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {bid.status === 'accepted' ? (
                        <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>✅ Accepted</span>
                      ) : bid.status === 'rejected' ? (
                        <span style={{ fontSize: 12, color: 'var(--text3)' }}>Rejected</span>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--text3)' }}>Pending</span>
                      )}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Link to={`/chat/${bid.bidder?._id}`} className="btn btn-ghost btn-sm">💬 Chat</Link>
                        {isOwner && task.status === 'open' && bid.status === 'pending' && (
                          <button className="btn btn-success btn-sm" onClick={() => handleAcceptBid(bid._id)}>✓ Accept</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          {/* Task owner card */}
          <div className="card" style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Posted By</div>
            <Link to={`/profile/${task.createdBy?._id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div className="avatar avatar-md">{task.createdBy?.name?.slice(0, 2).toUpperCase()}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{task.createdBy?.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{task.createdBy?.university || 'Student'}</div>
                <div style={{ fontSize: 11, color: 'var(--amber)' }}>
                  {task.createdBy?.averageRating > 0 ? `${Stars(task.createdBy.averageRating)} ${task.createdBy.averageRating}` : 'New user'}
                </div>
              </div>
            </Link>
            {!isOwner && (
              <Link to={`/chat/${task.createdBy?._id}`} className="btn btn-secondary btn-sm btn-full">💬 Message</Link>
            )}
          </div>

          {/* Stats */}
          <div className="card" style={{ marginBottom: 12 }}>
            {[
              { label: 'Budget', value: `$${task.budget}` },
              { label: 'Deadline', value: new Date(task.deadline).toLocaleDateString() },
              { label: 'Total Bids', value: bids.length },
              { label: 'Views', value: task.views || 0 },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                <span style={{ color: 'var(--text2)' }}>{s.label}</span>
                <span style={{ fontWeight: 600 }}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* Assigned to (if in progress) */}
          {task.assignedTo && (
            <div className="card">
              <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assigned To</div>
              <Link to={`/profile/${task.assignedTo?._id}`} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="avatar avatar-md" style={{ background: 'var(--green)' }}>{task.assignedTo?.name?.slice(0, 2).toUpperCase()}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{task.assignedTo?.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--green)' }}>Working on this task</div>
                  <div style={{ fontSize: 12, color: 'var(--green)', fontWeight: 700 }}>Accepted: ${task.acceptedAmount}</div>
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;
