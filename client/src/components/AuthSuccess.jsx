import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AuthSuccess() {
  const { setToken } = useAuth(); // Removed token from destructuring to avoid dependency
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tokenFromUrl = urlParams.get('token');

    if (tokenFromUrl) {
      // Only set the token if it differs from what's in localStorage
      const currentToken = localStorage.getItem('jwtToken');
      if (tokenFromUrl !== currentToken) {
        localStorage.setItem('jwtToken', tokenFromUrl);
        setToken(tokenFromUrl);
        
      } else {
        
      }
    } else {
      console.error('AuthSuccess - No token found in URL');
    }

    // Delay redirect to ensure state updates
    const timer = setTimeout(() => {
      navigate('/', { replace: true });
    }, 100); // Small delay to allow state to update

    return () => clearTimeout(timer); // Cleanup timer
  }, [location, navigate, setToken]); // Removed token from dependencies

  return <p>Authenticating... Please wait.</p>;
}

export default AuthSuccess;