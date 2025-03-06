import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthSuccess = () => {
  const { setToken } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tokenFromUrl = urlParams.get('token');
    console.log('Token from URL:', tokenFromUrl);
    if (tokenFromUrl) {
      localStorage.setItem('googleIdToken', tokenFromUrl);
      setToken(tokenFromUrl);
      console.log('Token set in context:', tokenFromUrl);
    }
    navigate('/', { replace: true });
  }, [setToken, navigate, location]);

  return <p>Authenticating... Please wait.</p>;
};

export default AuthSuccess;