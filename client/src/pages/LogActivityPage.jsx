import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/client';

const CATEGORY_COLORS = { transport: '#3b82f6', diet: '#f59e0b', energy: '#a855f7', travel: '#ef4444', shopping: '#06b6d4', custom: '#22c55e' };

export default function LogActivityPage() {
  const [presets, setPresets] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [customMode, setCustomMode] = useState(false);
  const [custom, setCustom] = useState({ action_name: '', category: 'custom', co2_saved_kg: '', notes: '' });
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');
  const [logging, setLogging] = useState(null);

  useEffect(() => {
    api.get('/activities/presets').then(res => setPresets(res.data.actions)).catch(console.error);
  }, []);

  const categories = ['all', ...new Set(presets.map(p => p.category))];

  const filtered = selectedCategory === 'all' ? presets : presets.filter(p => p.category === selectedCategory);

  const logPreset = async (action) => {
    setLogging(action.id); setError(''); setSuccess(null);
    try {
      const res = await api.post('/activities/log', {
        action_id: action.id, action_name: action.name,
        category: action.category, co2_saved_kg: action.co2_saved_kg,
      });
      setSuccess({ name: action.name, co2: action.co2_saved_kg, streak: res.data.streak });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to log activity');
    } finally {
      setLogging(null);
    }
  };

  const logCustom = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(null);
    try {
      const res = await api.post('/activities/log', {
        action_name: custom.action_name, category: custom.category,
        co2_saved_kg: parseFloat(custom.co2_saved_kg), notes: custom.notes,
      });
      setSuccess({ name: custom.action_name, co2: parseFloat(custom.co2_saved_kg), streak: res.data.streak });
      setCustom({ action_name: '', category: 'custom', co2_saved_kg: '', notes: '' });
    } catch (err) {
      setError(err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || 'Failed to log');
    }
  };

  return (
    <div style={{ padding: '80px 2rem 3rem', maxWidth: 1100, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="page-header">
        <h1 className="page-title">✅ Log an Eco-Action</h1>
        <p className="page-subtitle">Record your green habits and track the CO₂ you're saving</p>
      </motion.div>

      {/* Success banner */}
      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            style={{ background: 'var(--color-green-dim)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 12, padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--color-green)' }}>✅ Logged: {success.name}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                You saved <strong style={{ color: 'var(--color-green)' }}>{success.co2} kg CO₂</strong> · 🔥 {success.streak?.current_streak || 0} day streak
              </div>
            </div>
            <button onClick={() => setSuccess(null)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}>×</button>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div style={{ background: 'var(--color-red-dim)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '0.75rem 1rem', marginBottom: '1.5rem', color: 'var(--color-red)', fontSize: '0.85rem' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Toggle */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button id="tab-presets" onClick={() => setCustomMode(false)} className={customMode ? 'btn-secondary' : 'btn-primary'} style={{ padding: '0.5rem 1.25rem' }}>
          🌱 Preset Actions
        </button>
        <button id="tab-custom" onClick={() => setCustomMode(true)} className={customMode ? 'btn-primary' : 'btn-secondary'} style={{ padding: '0.5rem 1.25rem' }}>
          ✏️ Custom Action
        </button>
      </div>

      <AnimatePresence mode="wait">
        {!customMode ? (
          <motion.div key="presets" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Category filter */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              {categories.map(cat => (
                <button key={cat} id={`cat-${cat}`} onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '5px 14px', borderRadius: 99, border: '1px solid',
                    cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s',
                    borderColor: selectedCategory === cat ? CATEGORY_COLORS[cat] || 'var(--color-green)' : 'var(--color-border)',
                    background: selectedCategory === cat ? `${CATEGORY_COLORS[cat] || 'var(--color-green)'}22` : 'transparent',
                    color: selectedCategory === cat ? CATEGORY_COLORS[cat] || 'var(--color-green)' : 'var(--color-text-muted)',
                  }}>
                  {cat === 'all' ? '🌍 All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>

            {/* Action cards grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
              {filtered.map((action, i) => (
                <motion.div key={action.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }} className="glass-card" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '2rem' }}>{action.icon}</span>
                    <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>−{action.co2_saved_kg} kg CO₂</span>
                  </div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.4rem' }}>{action.name}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1rem', lineHeight: 1.6 }}>{action.description}</p>
                  <button id={`log-action-${action.id}`} onClick={() => logPreset(action)} disabled={logging === action.id}
                    className="btn-primary" style={{ width: '100%', padding: '0.6rem' }}>
                    {logging === action.id ? '⏳ Logging...' : 'Log This Action'}
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key="custom" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="glass-card" style={{ padding: '2rem', maxWidth: 520 }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>✏️ Log a Custom Action</h2>
              <form onSubmit={logCustom} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label className="form-label">Action Name</label>
                  <input id="custom-name" className="input-field" type="text" placeholder="e.g. Walked to the farmer's market" required
                    value={custom.action_name} onChange={e => setCustom(c => ({ ...c, action_name: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Category</label>
                  <select id="custom-category" className="input-field" value={custom.category}
                    onChange={e => setCustom(c => ({ ...c, category: e.target.value }))}>
                    <option value="transport">🚗 Transport</option>
                    <option value="diet">🥗 Diet</option>
                    <option value="energy">⚡ Energy</option>
                    <option value="travel">✈️ Travel</option>
                    <option value="shopping">🛍️ Shopping</option>
                    <option value="custom">🌱 Custom</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">CO₂ Saved (kg)</label>
                  <input id="custom-co2" className="input-field" type="number" step="0.01" min="0" placeholder="e.g. 1.5" required
                    value={custom.co2_saved_kg} onChange={e => setCustom(c => ({ ...c, co2_saved_kg: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Notes (optional)</label>
                  <input id="custom-notes" className="input-field" type="text" placeholder="Any extra details..."
                    value={custom.notes} onChange={e => setCustom(c => ({ ...c, notes: e.target.value }))} />
                </div>
                <button id="custom-submit-btn" type="submit" className="btn-primary" style={{ padding: '0.875rem' }}>
                  ✅ Log Custom Action
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
