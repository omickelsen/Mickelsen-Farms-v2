import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token, logout } = useAuth();

  const navItems = [
    { label: 'About Us', route: '/', sectionId: '#about' },
    { label: 'Services', route: '/horse-boarding', sectionId: '#services' },
    { label: 'Calendar', route: '/calendar', sectionId: '#calendar' },
    { label: 'Contact Us', route: '/contact', sectionId: '#contact' },
  ];

  const handleNavClick = (route, sectionId) => {
    if (location.pathname === '/') {
      const element = document.getElementById(sectionId.replace('#', ''));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate(route + sectionId);
    }
  };

  const handleBrandClick = () => {
    if (location.pathname !== '/') {
      navigate('/');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Ensure smooth scrolling on page load if URL has hash
  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.replace('#', ''));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location]);

  return (
    <header className="bg-teal-600 text-white p-4 flex justify-between items-center fixed w-full top-0 z-10">
      <div className="text-xl font-bold cursor-pointer" onClick={handleBrandClick}>
        Mickelsen Family Farms
      </div>
      <nav className="space-x-4">
        {navItems.map((item) => (
          <a
            key={item.label}
            href={item.route + item.sectionId}
            onClick={(e) => {
              e.preventDefault();
              handleNavClick(item.route, item.sectionId);
            }}
            className="hover:text-teal-200"
          >
            {item.label}
          </a>
        ))}
      </nav>
      <div className="flex items-center">
        <div id="google-signin" className={token ? 'hidden' : ''}></div>
        {token && (
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 ml-2"
          >
            Logout
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;