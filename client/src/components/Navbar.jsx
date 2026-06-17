import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/log',       label: 'Log Action', icon: '✅' },
  { to: '/calculator',label: 'Calculator', icon: '🧮' },
  { to: '/simulator', label: 'Simulator',  icon: '🔬' },
  { to: '/tips',      label: 'Tips',       icon: '💡' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(10,15,13,0.85)', backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--color-border)',
      padding: '0 1.5rem',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: '60px',
    }}>
      {/* Logo */}
      <NavLink to="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '1.4rem' }}>🌿</span>
        <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-green)' }}>CarbonTrack</span>
      </NavLink>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: '4px' }}>
        {links.map(({ to, label, icon }) => (
          <NavLink key={to} to={to} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '6px 12px', borderRadius: '8px', textDecoration: 'none',
            fontSize: '0.82rem', fontWeight: 600,
            color: isActive ? 'var(--color-green)' : 'var(--color-text-muted)',
            background: isActive ? 'var(--color-green-dim)' : 'transparent',
            transition: 'all 0.2s',
          })}>
            <span>{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </div>

      {/* User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'linear-gradient(135deg, #16a34a, #22c55e)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.8rem', fontWeight: 700, color: 'white',
        }}>
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <button onClick={handleLogout} className="btn-secondary" style={{ padding: '5px 12px', fontSize: '0.8rem' }}>
          Logout
        </button>
      </div>
    </nav>
  );
}
