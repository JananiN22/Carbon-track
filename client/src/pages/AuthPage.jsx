import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const [params] = useSearchParams();
  const [tab, setTab] = useState(params.get('tab') === 'login' ? 'login' : 'signup');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(user.onboarding_complete ? '/dashboard' : '/onboarding', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (tab === 'signup') {
        const u = await signup(form.name, form.email, form.password);
        navigate(u.onboarding_complete ? '/dashboard' : '/onboarding');
      } else {
        const u = await login(form.email, form.password);
        navigate(u.onboarding_complete ? '/dashboard' : '/onboarding');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hero-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="glass-card" style={{ width: '100%', maxWidth: 440, padding: '2.5rem' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🌿</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
            <span className="gradient-text">CarbonTrack</span>
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
            {tab === 'signup' ? 'Create your account to start tracking' : 'Welcome back'}
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '4px', marginBottom: '1.75rem' }}>
          {['signup', 'login'].map(t => (
            <button key={t} id={`tab-${t}`} onClick={() => { setTab(t); setError(''); }}
              style={{
                flex: 1, padding: '8px', border: 'none', borderRadius: '8px', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.875rem', transition: 'all 0.2s',
                background: tab === t ? 'var(--color-green-dim)' : 'transparent',
                color: tab === t ? 'var(--color-green)' : 'var(--color-text-muted)',
              }}>
              {t === 'signup' ? 'Sign Up' : 'Sign In'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <AnimatePresence mode="wait">
            {tab === 'signup' && (
              <motion.div key="name" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <label className="form-label">Full Name</label>
                <input id="input-name" className="input-field" type="text" placeholder="Jane Doe" required
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="form-label">Email Address</label>
            <input id="input-email" className="input-field" type="email" placeholder="you@example.com" required
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>

          <div>
            <label className="form-label">Password</label>
            <input id="input-password" className="input-field" type="password" placeholder="Min. 6 characters" required minLength={6}
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          </div>

          {error && (
            <div style={{ background: 'var(--color-red-dim)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '10px 14px', color: 'var(--color-red)', fontSize: '0.85rem' }}>
              ⚠️ {error}
            </div>
          )}

          <button id="auth-submit-btn" type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '0.5rem', padding: '0.875rem', fontSize: '0.95rem' }}>
            {loading ? '...' : tab === 'signup' ? 'Create Account →' : 'Sign In →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
          {tab === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
          <button onClick={() => { setTab(tab === 'signup' ? 'login' : 'signup'); setError(''); }}
            style={{ background: 'none', border: 'none', color: 'var(--color-green)', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>
            {tab === 'signup' ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
