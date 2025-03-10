import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AuthSuccess() {
  const { token, setToken } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tokenFromUrl = urlParams.get('token');

    console.log('AuthSuccess - URL Params:', location.search); // Debug log
    console.log('AuthSuccess - Token from URL:', tokenFromUrl); // Debug log

    if (tokenFromUrl) {
      if (tokenFromUrl !== token) {
        localStorage.setItem('jwtToken', tokenFromUrl);
        setToken(tokenFromUrl);
        console.log('AuthSuccess - Token set:', tokenFromUrl);
      } else {
        console.log('AuthSuccess - Token already set, no change needed');
      }
    } else {
      console.error('AuthSuccess - No token found in URL');
    }

    // Delay redirect to ensure state updates
    const timer = setTimeout(() => {
      navigate('/', { replace: true });
    }, 100); // Small delay to allow state to update

    return () => clearTimeout(timer); // Cleanup timer
  }, [token, setToken, location, navigate]);

  return <p>Authenticating... Please wait.</p>;
}

export default AuthSuccess;