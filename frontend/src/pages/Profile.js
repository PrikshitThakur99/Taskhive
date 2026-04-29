import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const Stars = ({ n }) => <span style={{ color: 'var(--amber)' }}>{'★'.repeat(n)}{'☆'.repeat(5 - n)}</span>;

const Profile = () => {
  const { id } = useParams();
  const { user: me, updateUser } = useAuth();
  const isMe = me?._id === id;
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [skillInput, setSkillInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [profileRes, reviewsRes] = await Promise.all([
          api.get(`/users/${id}`),
          api.get(`/reviews/user/${id}`),
        ]);
        setProfile(profileRes.data.user);
        setReviews(reviewsRes.data.reviews);
        setEditForm({
          name: profileRes.data.user.name,
          bio: profileRes.data.user.bio || '',
          university: profileRes.data.user.university || '',
          skills: [...(profileRes.data.user.skills || [])],
        });
      } catch { toast.error('Profile not found'); }
      finally { setLoading(false); }
    };
    fetch();
  }, [id]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/users/profile', editForm);
      setProfile(data.user);
      if (isMe) updateUser(data.user);
      setEditing(false);
      toast.success('Profile updated!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const addSkill = (s) => {
    const sk = s.trim();
    if (sk && !editForm.skills.includes(sk)) setEditForm(f => ({ ...f, skills: [...f.skills, sk] }));
    setSkillInput('');
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!profile) return null;

  const initials = profile.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const joinDate = new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="page-container" style={{ maxWidth: 800 }}>
      {/* Profile hero */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          <div className="avatar avatar-xl" style={{ background: 'linear-gradient(135deg, var(--accent), var(--blue))' }}>{initials}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{profile.name}</h1>
                {profile.university && <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>🎓 {profile.university}</div>}
                <div style={{ fontSize: 13, color: 'var(--amber)', marginBottom: 8 }}>
                  {profile.averageRating > 0
                    ? <><Stars n={Math.round(profile.averageRating)} /> <span style={{ color: 'var(--text2)' }}>{profile.averageRating} ({profile.totalReviews} reviews)</span></>
                    : <span style={{ color: 'var(--text3)' }}>No reviews yet</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>Member since {joinDate}</div>
              </div>
              {isMe && (
                <button className="btn btn-secondary btn-sm" onClick={() => setEditing(!editing)}>
                  {editing ? 'Cancel' : '✏️ Edit Profile'}
                </button>
              )}
              {!isMe && (
                <Link to={`/chat/${id}`} className="btn btn-primary btn-sm">💬 Message</Link>
              )}
            </div>
            {profile.bio && <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 12, lineHeight: 1.6 }}>{profile.bio}</p>}
          </div>
        </div>

        {/* Edit form */}
        {editing && (
          <form onSubmit={handleSave} style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Name</label>
                <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">University</label>
                <input value={editForm.university} onChange={e => setEditForm(f => ({ ...f, university: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea value={editForm.bio} onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))} placeholder="Tell others about yourself..." />
            </div>
            <div className="form-group">
              <label className="form-label">Skills</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input value={skillInput} placeholder="Add skill..." onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput); } }} style={{ flex: 1 }} />
                <button type="button" className="btn btn-secondary" onClick={() => addSkill(skillInput)}>Add</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {editForm.skills.map(s => (
                  <span key={s} className="chip">
                    {s}
                    <span className="chip-remove" onClick={() => setEditForm(f => ({ ...f, skills: f.skills.filter(x => x !== s) }))}>×</span>
                  </span>
                ))}
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
          </form>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Tasks Done', value: profile.completedTasksCount || 0 },
          { label: 'Total Earned', value: `$${(profile.totalEarned || 0).toFixed(0)}` },
          { label: 'Tasks Posted', value: profile.postedTasksCount || 0 },
          { label: 'Rating', value: profile.averageRating > 0 ? `${profile.averageRating}★` : 'N/A' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ textAlign: 'center' }}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ fontSize: 20 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Skills */}
      {profile.skills?.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>🛠️ Skills</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {profile.skills.map(s => <span key={s} className="chip">{s}</span>)}
          </div>
        </div>
      )}

      {/* Reviews */}
      <div className="card">
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>⭐ Reviews ({reviews.length})</div>
        {reviews.length === 0 ? (
          <div className="empty-state" style={{ padding: '24px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⭐</div>
            <div style={{ color: 'var(--text3)', fontSize: 13 }}>No reviews yet</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {reviews.map(r => (
              <div key={r._id} style={{ padding: 14, background: 'var(--bg3)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="avatar avatar-sm">{r.reviewer?.name?.slice(0, 2).toUpperCase()}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{r.reviewer?.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text3)' }}>{new Date(r.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <Stars n={r.rating} />
                </div>
                <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>{r.comment}</p>
                {r.task && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>Task: {r.task?.title}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
