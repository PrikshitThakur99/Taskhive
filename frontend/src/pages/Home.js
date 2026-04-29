import React from 'react';
import { Link } from 'react-router-dom';

const CATEGORIES = [
  { icon: '💻', label: 'Code', color: 'var(--green)' },
  { icon: '🎨', label: 'Design', color: 'var(--accent)' },
  { icon: '✍️', label: 'Writing', color: 'var(--amber)' },
  { icon: '📊', label: 'Data', color: 'var(--blue)' },
  { icon: '📐', label: 'Math', color: 'var(--red)' },
  { icon: '🔬', label: 'Research', color: 'var(--green)' },
];

const STATS = [
  { value: '2,400+', label: 'Students' },
  { value: '8,900+', label: 'Tasks Completed' },
  { value: '$450K+', label: 'Paid Out' },
  { value: '4.8★', label: 'Avg Rating' },
];

const Home = () => (
  <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>
    {/* Nav */}
    <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', height: 64, borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'rgba(13,13,20,0.95)', backdropFilter: 'blur(12px)', zIndex: 50 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 32, height: 32, background: 'var(--accent)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff' }}>T</div>
        <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.03em' }}>TaskHive</span>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <Link to="/login" className="btn btn-ghost">Login</Link>
        <Link to="/register" className="btn btn-primary">Get Started Free</Link>
      </div>
    </nav>

    {/* Hero */}
    <section style={{ textAlign: 'center', padding: '100px 20px 80px', maxWidth: 800, margin: '0 auto' }}>
      <div className="badge badge-purple" style={{ marginBottom: 20, fontSize: 12 }}>🎓 Built for Students</div>
      <h1 style={{ fontSize: 'clamp(36px,6vw,64px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 20 }}>
        Hire & work on<br />
        <span style={{ background: 'linear-gradient(135deg,var(--accent),var(--blue))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>micro‑tasks</span> as a student
      </h1>
      <p style={{ fontSize: 18, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 40, maxWidth: 560, margin: '0 auto 40px' }}>
        Post small tasks, bid on projects, and get paid — all within a trusted student community. Earn while you learn.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/register" className="btn btn-primary btn-lg">Start Earning →</Link>
        <Link to="/register" className="btn btn-secondary btn-lg">Post a Task</Link>
      </div>
    </section>

    {/* Stats */}
    <section style={{ display: 'flex', justifyContent: 'center', gap: 0, borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--bg2)' }}>
      {STATS.map((s, i) => (
        <div key={i} style={{ flex: 1, textAlign: 'center', padding: '28px 20px', borderRight: i < STATS.length - 1 ? '1px solid var(--border)' : 'none' }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)' }}>{s.value}</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>{s.label}</div>
        </div>
      ))}
    </section>

    {/* Categories */}
    <section style={{ padding: '80px 40px', textAlign: 'center' }}>
      <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 }}>Browse by Category</h2>
      <p style={{ color: 'var(--text2)', marginBottom: 40 }}>From coding to design — find or post tasks in any field</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 16, maxWidth: 700, margin: '0 auto' }}>
        {CATEGORIES.map(cat => (
          <Link to="/register" key={cat.label} style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '24px 16px', textAlign: 'center',
            transition: 'all 0.2s', cursor: 'pointer', display: 'block',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = cat.color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>{cat.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: cat.color }}>{cat.label}</div>
          </Link>
        ))}
      </div>
    </section>

    {/* How it works */}
    <section style={{ padding: '80px 40px', background: 'var(--bg2)', borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 }}>How TaskHive Works</h2>
        <p style={{ color: 'var(--text2)', marginBottom: 60 }}>Simple 4-step process for both task posters and freelancers</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 32 }}>
          {[
            { step: '01', icon: '📝', title: 'Post a Task', desc: 'Describe your task, set a budget, and add a deadline.' },
            { step: '02', icon: '🎯', title: 'Receive Bids', desc: 'Qualified students bid on your task with proposals.' },
            { step: '03', icon: '🤝', title: 'Accept & Start', desc: 'Accept the best bid. Funds go into escrow instantly.' },
            { step: '04', icon: '💸', title: 'Pay on Completion', desc: 'Approve the work and release payment securely.' },
          ].map(step => (
            <div key={step.step} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 12 }}>{step.step}</div>
              <div style={{ fontSize: 36, marginBottom: 12 }}>{step.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{step.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{step.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section style={{ padding: '80px 40px', textAlign: 'center' }}>
      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 12 }}>Ready to get started?</h2>
        <p style={{ color: 'var(--text2)', marginBottom: 32, fontSize: 16 }}>Join thousands of students earning and learning on TaskHive.</p>
        <Link to="/register" className="btn btn-primary btn-lg" style={{ width: '100%', maxWidth: 320 }}>
          Create Free Account →
        </Link>
        <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text3)' }}>$100 welcome balance · No credit card required</div>
      </div>
    </section>

    {/* Footer */}
    <footer style={{ borderTop: '1px solid var(--border)', padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text3)', fontSize: 12 }}>
      <span>© 2025 TaskHive. Built for students.</span>
      <span>Made with ❤️ using MERN Stack</span>
    </footer>
  </div>
);

export default Home;
