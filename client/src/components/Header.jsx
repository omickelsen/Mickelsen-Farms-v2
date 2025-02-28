import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Map navigation items to their routes and section IDs
  const navItems = [
    { label: 'About Us', route: '/', sectionId: '#about' },
    { label: 'Services', route: '/horse-boarding', sectionId: '#services' },
    { label: 'Calendar', route: '/calendar', sectionId: '#calendar' },
    { label: 'Owners', route: '/owners', sectionId: '#owners' }, // Adjust route if needed
    { label: 'Contact Us', route: '/contact', sectionId: '#contact' },
  ];

  const handleNavClick = (route, sectionId) => {
    if (location.pathname === '/') {
      // On homepage, scroll to section
      const element = document.getElementById(sectionId.replace('#', ''));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // On other pages, navigate to the route and scroll to section
      navigate(route + sectionId);
    }
  };

  // Handle brand click to navigate to homepage
  const handleBrandClick = () => {
    if (location.pathname !== '/') {
      navigate('/');
    }
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
      <div id="google-signin"></div> {/* Google Sign-In button placeholder */}
    </header>
  );
};

export default Header;