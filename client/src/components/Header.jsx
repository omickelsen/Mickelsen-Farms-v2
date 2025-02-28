import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const signInRef = useRef(null);

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
    setIsMobileMenuOpen(false);
  };

  const handleBrandClick = () => {
    if (location.pathname !== '/') {
      navigate('/');
    }
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  // Initialize Google Sign-In
  useEffect(() => {
    if (!window.google || !signInRef.current) {
      console.log('Google SDK or signInRef not available:', { windowGoogle: !!window.google, signInRef: signInRef.current });
      return;
    }

    const handleCredentialResponse = (response) => {
      console.log('Encoded JWT ID token:', response.credential);
      localStorage.setItem('googleIdToken', response.credential);
      window.location.href = '/';
    };

    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
      callback: handleCredentialResponse,
    });

    window.google.accounts.id.renderButton(signInRef.current, {
      theme: 'outline',
      size: 'medium',
      width: '200px',
    });

    return () => {
      // Optional cleanup
    };
  }, [token]);

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
    <header className="bg-teal-600 text-white p-4 flex justify-between items-center fixed w-full top-0 z-50 shadow-md  mx-auto">
      <div className="text-xl font-bold cursor-pointer flex items-center" onClick={handleBrandClick}>
        Mickelsen Family Farms
      </div>
      <div className="md:hidden">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-white focus:outline-none p-2"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
          </svg>
        </button>
      </div>
      <nav className={`md:flex md:space-x-4 ${isMobileMenuOpen ? 'block' : 'hidden'} md:block absolute md:static top-16 right-4 bg-teal-600 p-4 md:p-0 rounded-md md:rounded-none w-48 md:w-auto shadow-lg md:shadow-none`}>
        {navItems.map((item) => (
          <a
            key={item.label}
            href={item.route + item.sectionId}
            onClick={(e) => {
              e.preventDefault();
              handleNavClick(item.route, item.sectionId);
            }}
            className="block md:inline-block py-2 md:py-0 px-2 hover:text-teal-200 text-sm md:text-base"
          >
            {item.label}
          </a>
        ))}
      </nav>
      <div className="flex items-center space-x-2">
        <div ref={signInRef} id="google-signin" className={`${token ? 'hidden' : 'block'} w-48 md:w-56`}></div>
        {token && (
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm md:text-base"
          >
            Logout
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;