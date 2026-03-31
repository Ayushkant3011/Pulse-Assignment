import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  HiOutlineViewGrid,
  HiOutlineCloudUpload,
  HiOutlineUsers,
  HiOutlineLogout,
  HiOutlineMenu,
  HiOutlineX,
  HiStatusOnline,
} from 'react-icons/hi';

export default function Layout() {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { to: '/dashboard', icon: HiOutlineViewGrid, label: 'Dashboard' },
    { to: '/upload', icon: HiOutlineCloudUpload, label: 'Upload', roles: ['editor', 'admin'] },
    { to: '/users', icon: HiOutlineUsers, label: 'Users', roles: ['admin'] },
  ];

  const filteredNav = navItems.filter(
    (item) => !item.roles || item.roles.includes(user?.role)
  );

  const getInitials = (name) =>
    name ? name.slice(0, 2).toUpperCase() : '??';

  return (
    <div className="layout">
      {/* Mobile menu button */}
      <button
        className="mobile-menu-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        id="mobile-menu-toggle"
      >
        {sidebarOpen ? <HiOutlineX /> : <HiOutlineMenu />}
      </button>

      {/* Overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">⚡ Pulse</div>
        </div>

        <nav className="sidebar-nav">
          {filteredNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
              id={`nav-${item.label.toLowerCase()}`}
            >
              <item.icon className="nav-icon" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{getInitials(user?.username)}</div>
            <div className="user-details">
              <div className="user-name">{user?.username}</div>
              <div className="user-role">
                {user?.role}
                <HiStatusOnline
                  style={{
                    marginLeft: 6,
                    color: connected ? 'var(--accent-green)' : 'var(--accent-red)',
                    verticalAlign: 'middle',
                    fontSize: '0.7rem',
                  }}
                />
              </div>
            </div>
          </div>
          <button className="logout-btn" onClick={logout} id="logout-btn">
            <HiOutlineLogout />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
