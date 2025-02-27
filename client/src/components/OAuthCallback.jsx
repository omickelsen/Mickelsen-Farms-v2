import { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function OAuthCallback() {
  const { setToken } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    console.log('OAuthCallback URL params:', Object.fromEntries(urlParams));
    if (token) {
      console.log('Setting token from callback:', token);
      setToken(token);
      navigate('/admin', { replace: true });
    } else {
      console.log('No token found in URL parameters');
    }
  }, [setToken, navigate]);

  return <p>Processing authentication...</p>;
}

export default OAuthCallback;