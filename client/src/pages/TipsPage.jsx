import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../api/client';

const IMPACT_META = {
  high:   { label: 'High Impact',   color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  medium: { label: 'Medium Impact', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  low:    { label: 'Low Impact',    color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
};

const CATEGORY_META = {
  transport: { icon: '🚗', label: 'Transport',  color: '#3b82f6' },
  diet:      { icon: '🥗', label: 'Diet',        color: '#f59e0b' },
  energy:    { icon: '⚡', label: 'Energy',       color: '#a855f7' },
  travel:    { icon: '✈️', label: 'Travel',       color: '#ef4444' },
  shopping:  { icon: '🛍️', label: 'Shopping',   color: '#06b6d4' },
};

export default function TipsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/tips').then(res => setData(res.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="spinner" />
    </div>
  );

  const tips = data?.tips || [];
  const topCategory = data?.top_category;
  const breakdown = data?.breakdown || {};
  const ranking = data?.category_ranking || [];

  const filteredTips = filter === 'all' ? tips : tips.filter(t => t.impact === filter);

  return (
    <div style={{ padding: '80px 2rem 3rem', maxWidth: 1100, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="page-header">
        <h1 className="page-title">💡 Personalised Tips</h1>
        <p className="page-subtitle">Recommendations based on your highest emission categories</p>
      </motion.div>

      {/* Top category banner */}
      {topCategory && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card glow-green" style={{ padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ fontSize: '3rem' }}>{CATEGORY_META[topCategory]?.icon}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '4px' }}>
              Your biggest impact area is <span style={{ color: CATEGORY_META[topCategory]?.color }}>{CATEGORY_META[topCategory]?.label}</span>
            </div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              Focus on the tips below to make the biggest difference. Small changes here add up fast.
            </div>
          </div>
        </motion.div>
      )}

      {/* Category ranking */}
      {ranking.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Emission Ranking</h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {ranking.map((cat, i) => {
              const meta = CATEGORY_META[cat.key];
              const maxVal = ranking[0]?.value || 1;
              const pct = Math.round((cat.value / maxVal) * 100);
              return (
                <div key={cat.key} style={{ flex: '1 1 180px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{i + 1}. {meta?.icon} {meta?.label}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{cat.value.toFixed(0)} kg</span>
                  </div>
                  <div className="progress-bar-track">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }}
                      style={{ height: '100%', borderRadius: 99, background: meta?.color || 'var(--color-green)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Impact filter */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {['all', 'high', 'medium', 'low'].map(f => (
          <button key={f} id={`impact-filter-${f}`} onClick={() => setFilter(f)}
            style={{
              padding: '5px 14px', borderRadius: 99, border: '1px solid', cursor: 'pointer',
              fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s',
              background: filter === f ? (IMPACT_META[f]?.bg || 'var(--color-green-dim)') : 'transparent',
              color: filter === f ? (IMPACT_META[f]?.color || 'var(--color-green)') : 'var(--color-text-muted)',
              borderColor: filter === f ? (IMPACT_META[f]?.color || 'var(--color-green)') : 'var(--color-border)',
            }}>
            {f === 'all' ? '🌍 All Tips' : `${f.charAt(0).toUpperCase() + f.slice(1)} Impact`}
          </button>
        ))}
      </div>

      {/* Tips grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {filteredTips.map((tip, i) => {
          const impact = IMPACT_META[tip.impact] || IMPACT_META.low;
          return (
            <motion.div key={`${tip.title}-${i}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }} className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.875rem' }}>
                <span style={{ fontSize: '2rem' }}>{tip.icon}</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                  background: impact.bg, color: impact.color, border: `1px solid ${impact.color}44` }}>
                  {impact.label}
                </span>
              </div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem' }}>{tip.title}</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.7 }}>{tip.description}</p>
            </motion.div>
          );
        })}
        {filteredTips.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
            No tips for this filter. Try another impact level.
          </div>
        )}
      </div>
    </div>
  );
}
