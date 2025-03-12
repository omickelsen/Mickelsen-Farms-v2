import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AuthSuccess() {
  const { setToken } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tokenFromUrl = urlParams.get('token');
  
    if (tokenFromUrl) {
      const currentToken = localStorage.getItem('jwtToken');
      if (tokenFromUrl !== currentToken) {
        localStorage.setItem('jwtToken', tokenFromUrl);
        setToken(tokenFromUrl);
      }
    } else {
      console.error('AuthSuccess - No token found in URL');
    }
  
    const checkStateUpdate = () => {
      if (localStorage.getItem('jwtToken') === tokenFromUrl) {
        navigate('/', { replace: true });
      } else {
        setTimeout(checkStateUpdate, 50);
      }
    };
  
    checkStateUpdate();
  
    return () => clearTimeout(checkStateUpdate);
  }, [location, navigate, setToken]);

  return <p>Authenticating... Please wait.</p>;
}

export default AuthSuccess;