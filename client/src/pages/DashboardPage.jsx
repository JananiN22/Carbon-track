import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const CATEGORY_META = {
  transport: { icon: '🚗', label: 'Transport',  color: '#3b82f6' },
  diet:      { icon: '🥗', label: 'Diet',        color: '#f59e0b' },
  energy:    { icon: '⚡', label: 'Energy',       color: '#a855f7' },
  travel:    { icon: '✈️', label: 'Travel',       color: '#ef4444' },
  shopping:  { icon: '🛍️', label: 'Shopping',    color: '#06b6d4' },
  custom:    { icon: '🌱', label: 'Custom',       color: '#22c55e' },
};

function CountUp({ end, duration = 1500 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!end) return;
    const steps = 40;
    const inc = end / steps;
    let cur = 0;
    const t = setInterval(() => {
      cur += inc;
      if (cur >= end) { setVal(end); clearInterval(t); }
      else setVal(Math.round(cur * 10) / 10);
    }, duration / steps);
    return () => clearInterval(t);
  }, [end, duration]);
  return <span>{val.toFixed(1)}</span>;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: '#141f17', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 12px' }}>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginBottom: 4 }}>{label}</p>
        <p style={{ color: 'var(--color-green)', fontWeight: 700 }}>{payload[0].value.toFixed(2)} kg saved</p>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [onboarding, setOnboarding] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/activities/stats'), api.get('/onboarding')])
      .then(([statsRes, obRes]) => {
        setStats(statsRes.data);
        setOnboarding(obRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="spinner" />
    </div>
  );

  const streak = stats?.streak || {};
  const byCategory = stats?.by_category || [];
  const trend = stats?.trend || [];
  const totalSaved = stats?.total_saved || 0;
  const baseline = onboarding?.onboarding?.baseline_kg_co2 || 0;
  const breakdown = onboarding?.breakdown || {};
  const netFootprint = Math.max(0, baseline - totalSaved);
  const reductionPct = baseline > 0 ? Math.min(100, Math.round((totalSaved / baseline) * 100)) : 0;

  return (
    <div style={{ padding: '80px 2rem 3rem', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="page-header">
        <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="page-subtitle">Here's your carbon footprint overview</p>
      </motion.div>

      {/* Top KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Annual Baseline', value: baseline, unit: 'kg CO₂/yr', icon: '📍', color: 'var(--color-amber)' },
          { label: 'Total CO₂ Saved', value: totalSaved, unit: 'kg CO₂', icon: '✅', color: 'var(--color-green)' },
          { label: 'Net Footprint', value: netFootprint, unit: 'kg CO₂/yr', icon: '🌍', color: 'var(--color-blue)' },
          { label: 'Reduction', value: reductionPct, unit: '%', icon: '📉', color: '#a855f7', noDecimal: true },
        ].map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }} className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</span>
              <span style={{ fontSize: '1.25rem' }}>{card.icon}</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: card.color, lineHeight: 1 }}>
              {card.noDecimal ? <span>{Math.round(card.value)}</span> : <CountUp end={card.value} />}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>{card.unit}</div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Trend Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass-card" style={{ padding: '1.75rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.5rem' }}>📈 CO₂ Savings — Last 30 Days</h2>
          {trend.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
              <p style={{ fontSize: '0.875rem' }}>No activity logged yet.<br />Start logging eco-actions to see your trend!</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(34,197,94,0.08)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} tickLine={false} axisLine={false}
                  tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="co2_saved" stroke="#22c55e" strokeWidth={2.5}
                  dot={{ fill: '#22c55e', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: '#4ade80' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Streak + quick stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Streak card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="glass-card glow-green" style={{ padding: '1.75rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🔥</div>
            <div style={{ fontSize: '3.5rem', fontWeight: 900, color: 'var(--color-green)', lineHeight: 1 }}>
              {streak.current_streak || 0}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>Day Streak</div>
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-around' }}>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-amber)' }}>{streak.longest_streak || 0}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Best</div>
              </div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{streak.last_log_date || '—'}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Last Log</div>
              </div>
            </div>
          </motion.div>

          {/* Reduction badge */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              Footprint Reduced
            </div>
            <div className="progress-bar-track" style={{ marginBottom: '0.5rem' }}>
              <motion.div className="progress-bar-fill" initial={{ width: 0 }} animate={{ width: `${reductionPct}%` }} transition={{ duration: 1, delay: 0.5 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              <span>0%</span>
              <span style={{ color: 'var(--color-green)', fontWeight: 700 }}>{reductionPct}% achieved</span>
              <span>100%</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Baseline breakdown + savings by category */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Baseline breakdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="glass-card" style={{ padding: '1.75rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem' }}>📍 Your Baseline Breakdown</h2>
          {['transport', 'diet', 'energy', 'travel'].map(cat => {
            const meta = CATEGORY_META[cat];
            const val = breakdown[cat] || 0;
            const pct = baseline > 0 ? Math.round((val / baseline) * 100) : 0;
            return (
              <div key={cat} style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{meta.icon} {meta.label}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{val} kg ({pct}%)</span>
                </div>
                <div className="progress-bar-track">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.5 }}
                    style={{ height: '100%', borderRadius: 99, background: meta.color }} />
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Savings by category */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="glass-card" style={{ padding: '1.75rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem' }}>✅ Savings by Category</h2>
          {byCategory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              No savings recorded yet. Start logging actions!
            </div>
          ) : byCategory.map(cat => {
            const meta = CATEGORY_META[cat.category] || CATEGORY_META.custom;
            return (
              <div key={cat.category} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${meta.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                  {meta.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{meta.label}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-green)', fontWeight: 700 }}>{parseFloat(cat.total_saved).toFixed(2)} kg</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{cat.count} action{cat.count !== 1 ? 's' : ''} logged</div>
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
