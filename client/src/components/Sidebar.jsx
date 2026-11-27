import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, Scale, FileText, BarChart3, LogOut, Building2, UserCircle, PlusCircle, CheckSquare, CreditCard, FileCheck } from 'lucide-react';

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink to={to} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
      <Icon size={18} />
      {label}
    </NavLink>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const renderNav = () => {
    switch (user?.role) {
      case 'ADMIN':
        return (
          <>
            <div className="nav-section">
              <div className="nav-section-label">Admin</div>
              <NavItem to="/admin/dashboard" icon={LayoutDashboard} label="Dashboard" />
              <NavItem to="/admin/users" icon={Users} label="User Management" />
            </div>
            <div className="nav-section">
              <div className="nav-section-label">Advocates</div>
              <NavItem to="/advocates" icon={Scale} label="Advocate Directory" />
            </div>
            <div className="nav-section">
              <div className="nav-section-label">Bills</div>
              <NavItem to="/bills" icon={FileText} label="All Bills" />
            </div>
            <div className="nav-section">
              <div className="nav-section-label">Reports</div>
              <NavItem to="/reports" icon={BarChart3} label="Reports" />
            </div>
          </>
        );
      case 'HR':
        return (
          <>
            <div className="nav-section">
              <div className="nav-section-label">HR</div>
              <NavItem to="/hr/dashboard" icon={LayoutDashboard} label="Dashboard" />
            </div>
            <div className="nav-section">
              <div className="nav-section-label">Advocates</div>
              <NavItem to="/advocates" icon={Scale} label="Advocate Directory" />
              <NavItem to="/advocates/add" icon={PlusCircle} label="Add Advocate" />
            </div>
            <div className="nav-section">
              <div className="nav-section-label">Bills</div>
              <NavItem to="/bills/register" icon={PlusCircle} label="Register Bill" />
              <NavItem to="/bills" icon={FileText} label="All Bills" />
            </div>
          </>
        );
      case 'LEGAL':
        return (
          <>
            <div className="nav-section">
              <div className="nav-section-label">Legal</div>
              <NavItem to="/legal/dashboard" icon={LayoutDashboard} label="Dashboard" />
              <NavItem to="/bills" icon={FileCheck} label="All Bills" />
            </div>
          </>
        );
      case 'GM':
        return (
          <>
            <div className="nav-section">
              <div className="nav-section-label">GM</div>
              <NavItem to="/gm/dashboard" icon={LayoutDashboard} label="Dashboard" />
              <NavItem to="/bills" icon={FileText} label="All Bills" />
            </div>
          </>
        );
      case 'ACCOUNTS':
        return (
          <>
            <div className="nav-section">
              <div className="nav-section-label">Accounts</div>
              <NavItem to="/accounts/dashboard" icon={LayoutDashboard} label="Dashboard" />
              <NavItem to="/bills" icon={CreditCard} label="All Bills" />
              <NavItem to="/reports" icon={BarChart3} label="Reports" />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Building2 size={22} color="#93c5fd" />
          <div>
            <h2>BSPHCL</h2>
            <p>Advocate Bill System</p>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {renderNav()}
        <div className="nav-section" style={{ marginTop: 8 }}>
          <NavItem to="/profile" icon={UserCircle} label="Profile" />
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{initials}</div>
          <div>
            <div className="user-name">{user?.name}</div>
            <div className="user-role">{user?.role}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={15} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
