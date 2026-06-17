import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    { icon: '📊', title: 'Track Your Footprint', desc: 'Understand your CO₂ emissions across transport, diet, energy, and travel.' },
    { icon: '✅', title: 'Log Eco-Actions', desc: 'Record daily green habits and watch your carbon savings grow in real time.' },
    { icon: '🔥', title: 'Streak Tracker', desc: 'Stay consistent. Build daily logging streaks and beat your personal best.' },
    { icon: '🔬', title: 'What-If Simulator', desc: 'Adjust your habits virtually and see the projected impact on your footprint.' },
    { icon: '🧮', title: 'Carbon Calculator', desc: 'Input any activity and get an instant CO₂ estimate with category breakdown.' },
    { icon: '💡', title: 'Personalised Tips', desc: 'Receive targeted recommendations based on your highest emission category.' },
  ];

  return (
    <div className="hero-bg" style={{ minHeight: '100vh' }}>
      {/* Hero */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '8rem 2rem 4rem', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🌿</div>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 900, lineHeight: 1.1, marginBottom: '1.5rem' }}>
            Know your impact.<br />
            <span className="gradient-text">Change your future.</span>
          </h1>
          <p style={{ fontSize: '1.15rem', color: 'var(--color-text-muted)', maxWidth: 560, margin: '0 auto 2.5rem', lineHeight: 1.8 }}>
            CarbonTrack helps you measure, understand, and reduce your carbon footprint through simple daily actions and personalised insights.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button id="get-started-btn" className="btn-primary" style={{ fontSize: '1rem', padding: '0.875rem 2.5rem' }} onClick={() => navigate('/auth')}>
              Get Started Free →
            </button>
            <button className="btn-secondary" style={{ fontSize: '1rem', padding: '0.875rem 2rem' }} onClick={() => navigate('/auth?tab=login')}>
              Sign In
            </button>
          </div>
        </motion.div>

        {/* Stats bar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.6 }}
          style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginTop: '4rem', flexWrap: 'wrap' }}>
          {[['4.8T', 'tonnes CO₂ emitted yearly'], ['50%', 'reducible with lifestyle changes'], ['21 days', 'to build a new habit']].map(([val, label]) => (
            <div key={val} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-green)' }}>{val}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>{label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Features grid */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 2rem 6rem' }}>
        <h2 style={{ textAlign: 'center', fontSize: '1.75rem', fontWeight: 800, marginBottom: '2.5rem' }}>
          Everything you need to go <span className="gradient-text">greener</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {features.map((f, i) => (
            <motion.div key={f.title} className="glass-card" initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i, duration: 0.5 }}
              style={{ padding: '1.75rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{f.icon}</div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>{f.title}</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', lineHeight: 1.7 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center', padding: '4rem 2rem 8rem' }}>
        <div className="glass-card" style={{ maxWidth: 600, margin: '0 auto', padding: '3rem 2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🚀</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>Ready to reduce your footprint?</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.75rem', fontSize: '0.9rem' }}>
            Join CarbonTrack today. It's free, fast, and built for impact.
          </p>
          <button id="cta-signup-btn" className="btn-primary" style={{ fontSize: '1rem', padding: '0.875rem 2.5rem' }} onClick={() => navigate('/auth')}>
            Start Tracking Now →
          </button>
        </div>
      </div>
    </div>
  );
}
