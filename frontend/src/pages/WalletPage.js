import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const TX_COLORS = {
  credit: 'var(--green)', deposit: 'var(--blue)', escrow_lock: 'var(--amber)',
  escrow_release: 'var(--accent)', debit: 'var(--red)', withdrawal: 'var(--red)', refund: 'var(--green)',
};
const TX_ICONS = {
  credit: '💰', deposit: '💳', escrow_lock: '🔒',
  escrow_release: '🔓', debit: '📤', withdrawal: '🏦', refund: '↩️',
};

const WalletPage = () => {
  const { user, loadUser } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState(null); // 'deposit' | 'withdraw'
  const [submitting, setSubmitting] = useState(false);

  const fetchWallet = async () => {
    try {
      const { data } = await api.get('/wallet');
      setWallet(data);
    } catch { toast.error('Failed to load wallet'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchWallet(); }, []);

  const handleTransaction = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt < 1) { toast.error('Enter a valid amount'); return; }
    setSubmitting(true);
    try {
      const endpoint = mode === 'deposit' ? '/wallet/deposit' : '/wallet/withdraw';
      const { data } = await api.post(endpoint, { amount: amt });
      toast.success(data.message);
      setAmount(''); setMode(null);
      fetchWallet(); loadUser();
    } catch (err) { toast.error(err.response?.data?.message || 'Transaction failed'); }
    finally { setSubmitting(false); }
  };

  const chartData = wallet?.monthlyData?.map(d => ({
    month: MONTHS[d._id.month - 1],
    amount: d.total,
  })) || [];

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="page-container" style={{ maxWidth: 800 }}>
      <div className="page-header">
        <div className="page-title">My Wallet</div>
        <div className="page-subtitle">Manage your TaskHive balance</div>
      </div>

      {/* Balance card */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a35, #231e4a)',
        border: '1px solid rgba(124,106,247,0.3)',
        borderRadius: 'var(--radius-lg)', padding: 28, marginBottom: 20,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -30, top: -30, width: 150, height: 150, background: 'rgba(124,106,247,0.08)', borderRadius: '50%' }} />
        <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Available Balance</div>
        <div style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 16 }}>
          ${wallet?.wallet?.balance?.toFixed(2) || '0.00'}
        </div>
        <div style={{ display: 'flex', gap: 24, fontSize: 13, color: 'var(--text2)' }}>
          <span>🔒 Escrowed: <strong style={{ color: 'var(--amber)' }}>${wallet?.wallet?.escrow?.toFixed(2) || '0.00'}</strong></span>
          <span>📈 Total Earned: <strong style={{ color: 'var(--green)' }}>${wallet?.wallet?.totalEarned?.toFixed(2) || '0.00'}</strong></span>
          <span>📤 Total Spent: <strong style={{ color: 'var(--red)' }}>${wallet?.wallet?.totalSpent?.toFixed(2) || '0.00'}</strong></span>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="btn btn-success" onClick={() => setMode(mode === 'deposit' ? null : 'deposit')}>💳 Add Funds</button>
          <button className="btn btn-ghost" onClick={() => setMode(mode === 'withdraw' ? null : 'withdraw')}>🏦 Withdraw</button>
        </div>
      </div>

      {/* Transaction form */}
      {mode && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>
            {mode === 'deposit' ? '💳 Add Funds' : '🏦 Withdraw Funds'}
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {[10, 25, 50, 100, 250].map(q => (
              <button key={q} className="btn btn-secondary btn-sm" onClick={() => setAmount(String(q))}>+${q}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input type="number" placeholder="Enter amount" value={amount} min="1"
              onChange={e => setAmount(e.target.value)}
              style={{ flex: 1 }}
              onKeyDown={e => e.key === 'Enter' && handleTransaction()} />
            <button className="btn btn-primary" onClick={handleTransaction} disabled={submitting}>
              {submitting ? 'Processing...' : mode === 'deposit' ? 'Deposit' : 'Withdraw'}
            </button>
            <button className="btn btn-ghost" onClick={() => setMode(null)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>📊 Monthly Earnings</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData}>
              <XAxis dataKey="month" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 12 }} formatter={v => [`$${v}`, 'Earned']} />
              <Bar dataKey="amount" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Transaction history */}
      <div className="card">
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>📜 Transaction History</div>
        {wallet?.transactions?.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text3)', fontSize: 13 }}>No transactions yet</div>
        ) : (
          <div>
            {wallet?.transactions?.map(tx => (
              <div key={tx._id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 0', borderBottom: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: tx.type === 'credit' || tx.type === 'deposit' || tx.type === 'refund' ? 'var(--green-bg)' : 'var(--red-bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                  }}>{TX_ICONS[tx.type] || '💱'}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{tx.description}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                      {new Date(tx.createdAt).toLocaleDateString()} · Ref: {tx.reference}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: TX_COLORS[tx.type] || 'var(--text)' }}>
                    {['credit', 'deposit', 'refund', 'escrow_release'].includes(tx.type) ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>Balance: ${tx.balanceAfter?.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletPage;
