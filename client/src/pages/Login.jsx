import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Building2, Lock, User, AlertCircle, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isWarmingUp, setIsWarmingUp] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Proactively pre-warm backend server in background while user types credentials
    api.get('/health').catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setError('');
    setLoading(true);
    setIsWarmingUp(false);

    // If server was sleeping (Render free tier), notify user after 2.5s
    const warmTimer = setTimeout(() => {
      setIsWarmingUp(true);
    }, 2500);

    try {
      const user = await login(username.trim(), password);
      clearTimeout(warmTimer);
      // Role-based redirection
      switch (user.role) {
        case 'ADMIN':
          navigate('/admin/dashboard');
          break;
        case 'HR':
          navigate('/hr/dashboard');
          break;
        case 'LEGAL':
          navigate('/legal/dashboard');
          break;
        case 'GM':
          navigate('/gm/dashboard');
          break;
        case 'ACCOUNTS':
          navigate('/accounts/dashboard');
          break;
        default:
          navigate('/bills');
      }
    } catch (err) {
      clearTimeout(warmTimer);
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      clearTimeout(warmTimer);
      setIsWarmingUp(false);
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
            <Building2 size={28} color="#1e3a5f" />
            <h1 style={{ margin: 0, fontSize: '20px' }}>BSPHCL</h1>
          </div>
          <p style={{ fontWeight: 600, color: '#1e3a5f', fontSize: '15px' }}>
            Advocate Bill Management System
          </p>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Secure Departmental Workflow & Offline Payment Portal
          </p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: 16 }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">
              Username <span className="required">*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="username"
                type="text"
                className="form-control"
                style={{ paddingLeft: '36px' }}
                placeholder="Enter departmental username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
              />
              <User size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#9ca3af' }} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="form-label" htmlFor="password">
              Password <span className="required">*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                style={{ paddingLeft: '36px', paddingRight: '40px' }}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <Lock size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#9ca3af' }} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px',
                  borderRadius: '4px'
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: '14px' }}
            disabled={loading}
          >
            {loading ? (
              <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
            ) : (
              <>
                Sign In to Department Portal
                <ArrowRight size={16} />
              </>
            )}
          </button>

          {isWarmingUp && (
            <div style={{ marginTop: '14px', fontSize: '12px', color: '#475569', textAlign: 'center', background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', lineHeight: 1.5 }}>
              <div style={{ fontWeight: 600, color: '#1e3a5f', marginBottom: '2px' }}>
                ⏳ Waking up cloud server...
              </div>
              <div>Free-tier cloud servers enter standby mode when idle. First request takes ~20–30s.</div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
