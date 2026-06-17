import { useState } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../api/client';

const COLORS = { transport: '#3b82f6', diet: '#f59e0b', energy: '#a855f7', travel: '#ef4444' };

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: '#141f17', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 12px' }}>
        <p style={{ color: payload[0].payload.fill, fontWeight: 700 }}>{payload[0].name}</p>
        <p style={{ color: 'var(--color-text-primary)', fontSize: '0.85rem' }}>{payload[0].value.toFixed(1)} kg CO₂/yr</p>
      </div>
    );
  }
  return null;
};

export default function CalculatorPage() {
  const [form, setForm] = useState({ transport_type: 'car', weekly_km: 150, diet_type: 'omnivore', electricity_kwh: 300, flights_per_year: 2 });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCalc = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.post('/calculator', {
        transport_type: form.transport_type,
        weekly_km: parseFloat(form.weekly_km) || 0,
        diet_type: form.diet_type,
        electricity_kwh: parseFloat(form.electricity_kwh) || 0,
        flights_per_year: parseInt(form.flights_per_year) || 0,
      });
      setResult(res.data);
    } catch (err) {
      setError('Calculation failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  const pieData = result ? [
    { name: '🚗 Transport', value: result.breakdown.transport, fill: COLORS.transport },
    { name: '🥗 Diet',      value: result.breakdown.diet,      fill: COLORS.diet },
    { name: '⚡ Energy',    value: result.breakdown.energy,    fill: COLORS.energy },
    { name: '✈️ Travel',   value: result.breakdown.travel,    fill: COLORS.travel },
  ].filter(d => d.value > 0) : [];

  return (
    <div style={{ padding: '80px 2rem 3rem', maxWidth: 1100, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="page-header">
        <h1 className="page-title">🧮 Carbon Calculator</h1>
        <p className="page-subtitle">Enter your usage data to estimate your annual CO₂ footprint</p>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: '1.5rem', maxWidth: result ? '100%' : 640, margin: result ? '0' : '0 auto' }}>
        {/* Input form */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Your Habits</h2>
          <form onSubmit={handleCalc} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label className="form-label">Primary Transport</label>
              <select id="calc-transport" className="input-field" value={form.transport_type}
                onChange={e => setForm(f => ({ ...f, transport_type: e.target.value }))}>
                <option value="car">🚗 Car (petrol/diesel)</option>
                <option value="electric">⚡ Electric Car</option>
                <option value="motorcycle">🏍️ Motorcycle</option>
                <option value="transit">🚌 Public Transit</option>
                <option value="bike">🚲 Bike</option>
                <option value="walk">🚶 Walk</option>
              </select>
            </div>
            <div>
              <label className="form-label">Weekly km travelled</label>
              <input id="calc-weekly-km" className="input-field" type="number" min="0" value={form.weekly_km}
                onChange={e => setForm(f => ({ ...f, weekly_km: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Diet Type</label>
              <select id="calc-diet" className="input-field" value={form.diet_type}
                onChange={e => setForm(f => ({ ...f, diet_type: e.target.value }))}>
                <option value="meat-heavy">🥩 Meat-heavy</option>
                <option value="omnivore">🍽️ Omnivore</option>
                <option value="vegetarian">🥦 Vegetarian</option>
                <option value="vegan">🌱 Vegan</option>
              </select>
            </div>
            <div>
              <label className="form-label">Monthly Electricity (kWh)</label>
              <input id="calc-electricity" className="input-field" type="number" min="0" value={form.electricity_kwh}
                onChange={e => setForm(f => ({ ...f, electricity_kwh: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Flights per year (round trips)</label>
              <input id="calc-flights" className="input-field" type="number" min="0" value={form.flights_per_year}
                onChange={e => setForm(f => ({ ...f, flights_per_year: e.target.value }))} />
            </div>
            {error && <div style={{ color: 'var(--color-red)', fontSize: '0.85rem' }}>⚠️ {error}</div>}
            <button id="calc-submit-btn" type="submit" className="btn-primary" disabled={loading} style={{ padding: '0.875rem' }}>
              {loading ? '⏳ Calculating...' : '🧮 Calculate My Footprint'}
            </button>
          </form>
        </motion.div>

        {/* Results */}
        {result && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Donut chart */}
            <div className="glass-card" style={{ padding: '2rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>CO₂ Breakdown</h2>
              <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--color-amber)' }}>{result.breakdown.total}</span>
                <span style={{ color: 'var(--color-text-muted)', marginLeft: 6, fontSize: '0.9rem' }}>kg CO₂/year</span>
              </div>
              <div className={`badge ${result.percent_vs_avg > 0 ? 'badge-red' : 'badge-green'}`} style={{ margin: '0 auto 1rem', display: 'table' }}>
                {result.percent_vs_avg > 0 ? `+${result.percent_vs_avg}%` : `${result.percent_vs_avg}%`} vs world avg ({result.world_avg_kg.toLocaleString()} kg)
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} strokeWidth={0} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={(val) => <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{val}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Category breakdown */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              {[
                { key: 'transport', icon: '🚗', label: 'Transport' },
                { key: 'diet',      icon: '🥗', label: 'Diet' },
                { key: 'energy',    icon: '⚡', label: 'Energy' },
                { key: 'travel',    icon: '✈️', label: 'Travel' },
              ].map(({ key, icon, label }) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '0.9rem' }}>{icon} {label}</span>
                  <span style={{ fontWeight: 700, color: COLORS[key] }}>{result.breakdown[key]} kg/yr</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
