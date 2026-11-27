import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Building2, Shield, User } from 'lucide-react';

export default function Topbar({ title, subtitle }) {
  const { user } = useAuth();

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'ADMIN': return 'badge-admin';
      case 'HR': return 'badge-hr';
      case 'LEGAL': return 'badge-legal';
      case 'GM': return 'badge-gm';
      case 'ACCOUNTS': return 'badge-accounts';
      default: return 'badge-draft';
    }
  };

  return (
    <header className="topbar">
      <div>
        <h1 className="topbar-title">{title || 'Bihar State Power Holding Company Limited'}</h1>
        {subtitle && <p className="text-muted" style={{ fontSize: '12px' }}>{subtitle}</p>}
      </div>
      <div className="topbar-actions">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={`badge ${getRoleBadgeClass(user?.role)}`}>
            {user?.role}
          </span>
          <span style={{ fontSize: '13px', fontWeight: 500, color: '#334155' }}>
            {user?.name}
          </span>
        </div>
      </div>
    </header>
  );
}
