import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import api from '../api/client';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) return (
    <div style={{ background: '#141f17', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 12px' }}>
      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.fill, fontWeight: 700, fontSize: '0.85rem' }}>{p.name}: {p.value.toFixed(1)} kg</p>
      ))}
    </div>
  );
  return null;
};

export default function SimulatorPage() {
  const [form, setForm] = useState({ transport_type: 'car', weekly_km: 150, diet_type: 'omnivore', electricity_kwh: 300, flights_per_year: 2 });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load current onboarding data
  useEffect(() => {
    api.get('/onboarding').then(res => {
      const o = res.data.onboarding;
      if (o) setForm({ transport_type: o.transport_type, weekly_km: o.weekly_km, diet_type: o.diet_type, electricity_kwh: o.electricity_kwh, flights_per_year: o.flights_per_year });
    }).catch(() => {});
  }, []);

  const simulate = async () => {
    setLoading(true);
    try {
      const res = await api.post('/simulator', {
        transport_type: form.transport_type,
        weekly_km: parseFloat(form.weekly_km) || 0,
        diet_type: form.diet_type,
        electricity_kwh: parseFloat(form.electricity_kwh) || 0,
        flights_per_year: parseInt(form.flights_per_year) || 0,
      });
      setResult(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { simulate(); }, [form]);

  const chartData = result ? [
    { name: '🚗 Transport', Current: result.current.transport, Projected: result.projected.transport },
    { name: '🥗 Diet',      Current: result.current.diet,      Projected: result.projected.diet },
    { name: '⚡ Energy',    Current: result.current.energy,    Projected: result.projected.energy },
    { name: '✈️ Travel',   Current: result.current.travel,    Projected: result.projected.travel },
  ] : [];

  const SliderRow = ({ label, id, field, min, max, step, unit }) => (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <label className="form-label" style={{ marginBottom: 0 }}>{label}</label>
        <span style={{ color: 'var(--color-green)', fontWeight: 700, fontSize: '0.875rem' }}>{form[field]} {unit}</span>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={form[field]}
        onChange={e => setForm(f => ({ ...f, [field]: parseFloat(e.target.value) }))} />
    </div>
  );

  return (
    <div style={{ padding: '80px 2rem 3rem', maxWidth: 1200, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="page-header">
        <h1 className="page-title">🔬 What-If Simulator</h1>
        <p className="page-subtitle">Adjust your habits and see the projected impact on your footprint</p>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '1.5rem' }}>
        {/* Controls */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card" style={{ padding: '2rem', height: 'fit-content' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.5rem' }}>⚙️ Adjust Your Habits</h2>

          <div>
            <label className="form-label">Transport Mode</label>
            <select id="sim-transport" className="input-field" value={form.transport_type}
              onChange={e => setForm(f => ({ ...f, transport_type: e.target.value }))} style={{ marginBottom: '1.25rem' }}>
              <option value="car">🚗 Car</option>
              <option value="electric">⚡ Electric Car</option>
              <option value="motorcycle">🏍️ Motorcycle</option>
              <option value="transit">🚌 Public Transit</option>
              <option value="bike">🚲 Bike</option>
              <option value="walk">🚶 Walk</option>
            </select>
          </div>

          <SliderRow label="Weekly km" id="sim-km" field="weekly_km" min={0} max={500} step={10} unit="km" />

          <div style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Diet Type</label>
            <select id="sim-diet" className="input-field" value={form.diet_type}
              onChange={e => setForm(f => ({ ...f, diet_type: e.target.value }))}>
              <option value="meat-heavy">🥩 Meat-heavy</option>
              <option value="omnivore">🍽️ Omnivore</option>
              <option value="vegetarian">🥦 Vegetarian</option>
              <option value="vegan">🌱 Vegan</option>
            </select>
          </div>

          <SliderRow label="Monthly Electricity" id="sim-electricity" field="electricity_kwh" min={0} max={1000} step={10} unit="kWh" />
          <SliderRow label="Flights per Year" id="sim-flights" field="flights_per_year" min={0} max={20} step={1} unit="flights" />
        </motion.div>

        {/* Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {result && (
            <>
              {/* Summary numbers */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                {[
                  { label: 'Current Footprint', value: result.current.total, color: 'var(--color-amber)', icon: '📍' },
                  { label: 'Projected Footprint', value: result.projected.total, color: 'var(--color-green)', icon: '🎯' },
                  { label: 'Annual Savings', value: result.savings.total, color: '#a855f7', icon: '💚' },
                ].map(card => (
                  <div key={card.label} className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{card.icon}</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: card.color }}>{Math.abs(card.value).toFixed(0)}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>kg CO₂/yr</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, marginTop: '4px' }}>{card.label}</div>
                  </div>
                ))}
              </motion.div>

              {/* Reduction % */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                className={`glass-card ${result.percent_reduction > 0 ? 'glow-green' : ''}`}
                style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: result.percent_reduction > 0 ? 'var(--color-green)' : 'var(--color-red)', minWidth: 80 }}>
                  {result.percent_reduction > 0 ? '↓' : '↑'}{Math.abs(result.percent_reduction)}%
                </div>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 2 }}>
                    {result.percent_reduction > 0 ? '🎉 Your projected footprint is lower!' : '⚠️ This would increase your footprint'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    {result.percent_reduction > 0
                      ? `You'd save ${result.savings.total.toFixed(0)} kg CO₂ per year with these habits.`
                      : 'Try switching to greener options to reduce your impact.'}
                  </div>
                </div>
              </motion.div>

              {/* Bar chart comparison */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
                className="glass-card" style={{ padding: '1.75rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem' }}>📊 Category Comparison</h2>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={chartData} barGap={4} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(34,197,94,0.08)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend formatter={v => <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{v}</span>} />
                    <Bar dataKey="Current" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Projected" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            </>
          )}
          {loading && <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>}
        </div>
      </div>
    </div>
  );
}
