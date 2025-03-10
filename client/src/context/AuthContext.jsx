import { createContext, useState, useEffect, useContext } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('jwtToken') || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [renderTrigger, setRenderTrigger] = useState(0);

  useEffect(() => {
    const initializeAuth = async () => {
      const jwtToken = localStorage.getItem('jwtToken');
      console.log('Initializing auth with token:', jwtToken);
      if (jwtToken) {
        try {
          const response = await fetchWithToken('/api/verify-token', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${jwtToken}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            setIsAdmin(data.isAdmin);
            setUser({ email: data.email });
            setToken(jwtToken);
            console.log('Auth initialized successfully for:', data.email);
          } else {
            throw new Error('Token verification failed');
          }
        } catch (err) {
          console.error('Auth error:', err.message);
          setError(err.message);
          localStorage.removeItem('jwtToken');
          setToken(null);
          setUser(null);
          setIsAdmin(false);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    console.log('Token updated in context:', token);
    if (token) {
      localStorage.setItem('jwtToken', token);
      setRenderTrigger(prev => prev + 1);
    } else {
      localStorage.removeItem('jwtToken');
      setRenderTrigger(prev => prev + 1);
    }
  }, [token]);

  const logout = () => {
    localStorage.removeItem('jwtToken');
    setToken(null);
    setUser(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ token, setToken, user, logout, loading, error, isAdmin, renderTrigger }}>
      {loading ? <p>Loading authentication...</p> : error ? <p>Error: {error}</p> : children}
    </AuthContext.Provider>
  );
};

export const fetchWithToken = async (url, options = {}) => {
  const jwtToken = localStorage.getItem('jwtToken');
  let baseUrl;

  if (typeof window !== 'undefined') {
    const host = window.location.host;
    if (host === 'localhost' || host === '127.0.0.1' || host.includes('3000')) {
      baseUrl = 'http://localhost:5000';
    } else {
      baseUrl = 'https://mickelsen-family-farms.herokuapp.com';
    }
  } else if (process.env.NODE_ENV === 'production') {
    baseUrl = 'https://mickelsen-family-farms.herokuapp.com';
  } else {
    baseUrl = 'http://localhost:5000';
  }

  const headers = {
    ...options.headers,
  };
  if (jwtToken) {
    headers['Authorization'] = `Bearer ${jwtToken}`;
  }

  if (typeof url !== 'string') {
    throw new Error(`Invalid URL: ${url}`);
  }

  const finalUrl = url.startsWith('http') ? url : `${baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'}${url.replace(/^\//, '')}`;
  console.log('Fetching from:', finalUrl);

  try {
    const response = await fetch(finalUrl, {
      ...options,
      headers,
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response;
  } catch (err) {
    console.error('Fetch error:', err.message);
    throw err;
  }
};

export const useAuth = () => useContext(AuthContext);