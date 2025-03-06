import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  const navItems = [
    { label: 'About Us', route: '/', sectionId: '#about' },
    { label: 'Services', route: '/', sectionId: '#services' },
    { label: 'Calendar', route: '/calendar', sectionId: '#calendar' },
    { label: 'Contact Us', route: '/', sectionId: '#contact' },
  ];

  const handleNavClick = (route, sectionId) => {
    if (location.pathname === '/') {
      const element = document.getElementById(sectionId.replace('#', ''));
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(route + sectionId);
    }
    setIsMobileMenuOpen(false);
  };

  const handleBrandClick = () => {
    if (location.pathname !== '/') navigate('/');
    setIsMobileMenuOpen(false);
  };

  const handleLoginClick = (e) => {
    e.preventDefault(); // Prevent page refresh
    window.location.href = 'http://localhost:5000/auth/google'; // Use absolute URL for testing
    // For production, use the Heroku URL or adjust based on environment
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => setIsHeaderVisible(window.scrollY <= 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header className={`bg-teal-600 text-white p-4 flex justify-between items-center w-full top-0 z-50 shadow-md transition-transform duration-300 ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="text-xl font-bold cursor-pointer flex items-center" onClick={handleBrandClick}>
          Mickelsen Family Farms
        </div>
        <div className="md:hidden">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white focus:outline-none p-2" aria-label="Toggle menu">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
            </svg>
          </button>
        </div>
        <nav className={`md:flex md:space-x-4 ${isMobileMenuOpen ? 'block' : 'hidden'} md:block absolute md:static top-16 right-4 bg-teal-600 p-2 md:p-0 rounded-md md:rounded-none w-36 md:w-auto shadow-lg md:shadow-none`}>
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.route + item.sectionId}
              onClick={(e) => {
                e.preventDefault();
                handleNavClick(item.route, item.sectionId);
              }}
              className="block md:inline-block py-1 md:py-0 px-1 hover:text-teal-200 text-xs md:text-base"
            >
              {item.label}
            </a>
          ))}
          <div className="md:hidden mt-4">
            {!token && (
              <button onClick={handleLoginClick} className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm md:text-base w-full mt-2">
                Login
              </button>
            )}
            {token && (
              <button onClick={handleLogout} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm md:text-base w-full mt-2">
                Logout
              </button>
            )}
          </div>
        </nav>
        <div className="hidden md:flex items-center space-x-2">
          {!token && (
            <button onClick={handleLoginClick} className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm md:text-base">
              Login
            </button>
          )}
          {token && (
            <button onClick={handleLogout} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm md:text-base">
              Logout
            </button>
          )}
        </div>
      </header>
      {!isHeaderVisible && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-4 right-4 bg-teal-600 text-white p-2 rounded-full shadow-lg"
          aria-label="Scroll to top"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path>
          </svg>
        </button>
      )}
    </>
  );
};

export default Header;