import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const STEPS = [
  {
    id: 'transport',
    title: 'How do you get around?',
    subtitle: 'Tell us about your primary mode of transportation.',
    icon: '🚗',
    fields: [
      { id: 'transport_type', label: 'Primary Transport', type: 'select',
        options: [
          { value: 'car', label: '🚗 Car (petrol/diesel)' },
          { value: 'electric', label: '⚡ Electric Car' },
          { value: 'motorcycle', label: '🏍️ Motorcycle' },
          { value: 'transit', label: '🚌 Public Transit' },
          { value: 'bike', label: '🚲 Bike' },
          { value: 'walk', label: '🚶 Walk' },
        ]},
      { id: 'weekly_km', label: 'Weekly distance (km)', type: 'number', min: 0, placeholder: 'e.g. 150' },
    ],
  },
  {
    id: 'diet',
    title: 'What\'s your diet like?',
    subtitle: 'Food production is a major source of emissions.',
    icon: '🥗',
    fields: [
      { id: 'diet_type', label: 'Diet Type', type: 'select',
        options: [
          { value: 'meat-heavy', label: '🥩 Meat-heavy (daily meat)' },
          { value: 'omnivore',   label: '🍽️ Omnivore (some meat)' },
          { value: 'vegetarian', label: '🥦 Vegetarian' },
          { value: 'vegan',      label: '🌱 Vegan' },
        ]},
    ],
  },
  {
    id: 'energy',
    title: 'Home energy usage',
    subtitle: 'Your electricity consumption at home.',
    icon: '⚡',
    fields: [
      { id: 'electricity_kwh', label: 'Monthly electricity usage (kWh)', type: 'number', min: 0, placeholder: 'e.g. 300' },
    ],
  },
  {
    id: 'travel',
    title: 'Do you fly?',
    subtitle: 'Air travel has a significant climate impact.',
    icon: '✈️',
    fields: [
      { id: 'flights_per_year', label: 'Flights per year (round trips)', type: 'number', min: 0, placeholder: 'e.g. 2' },
    ],
  },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ transport_type: 'car', weekly_km: 150, diet_type: 'omnivore', electricity_kwh: 300, flights_per_year: 2 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  const currentStep = STEPS[step];
  const progress = ((step) / STEPS.length) * 100;

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else handleSubmit();
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/onboarding', {
        transport_type: form.transport_type,
        weekly_km: parseFloat(form.weekly_km) || 0,
        diet_type: form.diet_type,
        electricity_kwh: parseFloat(form.electricity_kwh) || 0,
        flights_per_year: parseInt(form.flights_per_year) || 0,
      });
      await refreshUser();
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hero-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: 560 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-green)', marginBottom: '0.5rem' }}>🌿 CarbonTrack</div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Step {step + 1} of {STEPS.length} — Set your baseline</p>
        </div>

        {/* Progress */}
        <div className="progress-bar-track" style={{ marginBottom: '2rem' }}>
          <motion.div className="progress-bar-fill" animate={{ width: `${progress + 25}%` }} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }} className="glass-card" style={{ padding: '2.5rem' }}>

            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{currentStep.icon}</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>{currentStep.title}</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>{currentStep.subtitle}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {currentStep.fields.map(field => (
                <div key={field.id}>
                  <label className="form-label">{field.label}</label>
                  {field.type === 'select' ? (
                    <select id={`field-${field.id}`} className="input-field"
                      value={form[field.id]} onChange={e => setForm(f => ({ ...f, [field.id]: e.target.value }))}>
                      {field.options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input id={`field-${field.id}`} className="input-field" type={field.type}
                      min={field.min} placeholder={field.placeholder}
                      value={form[field.id]} onChange={e => setForm(f => ({ ...f, [field.id]: e.target.value }))} />
                  )}
                </div>
              ))}
            </div>

            {error && (
              <div style={{ marginTop: '1rem', background: 'var(--color-red-dim)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '10px 14px', color: 'var(--color-red)', fontSize: '0.85rem' }}>
                ⚠️ {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              {step > 0 && (
                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setStep(s => s - 1)}>← Back</button>
              )}
              <button id="onboarding-next-btn" className="btn-primary" style={{ flex: 1 }} onClick={handleNext} disabled={loading}>
                {loading ? '...' : step === STEPS.length - 1 ? '🌿 See My Footprint →' : 'Next →'}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
