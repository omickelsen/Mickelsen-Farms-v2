import { createContext, useState, useEffect, useContext } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('jwtToken') || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      const jwtToken = localStorage.getItem('jwtToken');
      if (jwtToken) {
        try {
          // Verify token with backend
          const response = await fetch('http://localhost:5000/api/verify-token', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${jwtToken}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            setIsAdmin(data.isAdmin);
            setUser({ email: data.email });
            setToken(jwtToken); // Ensure token is set
          } else {
            throw new Error('Token verification failed');
          }
        } catch (err) {
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
  }, []); // Run only on mount

  // Update token in localStorage and state when setToken is called
  useEffect(() => {
    if (token) {
      localStorage.setItem('jwtToken', token);
    } else {
      localStorage.removeItem('jwtToken');
    }
  }, [token]);

  const logout = () => {
    localStorage.removeItem('jwtToken');
    setToken(null);
    setUser(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ token, setToken, user, logout, loading, error, isAdmin }}>
      {loading ? <p>Loading authentication...</p> : error ? <p>Error: {error}</p> : children}
    </AuthContext.Provider>
  );
};

export const fetchWithToken = async (url, options = {}) => {
  const jwtToken = localStorage.getItem('jwtToken');
  const baseUrl = process.env.NODE_ENV === 'production'
    ? 'https://mickelsen-family-farms.herokuapp.com'
    : 'http://localhost:5000';

  // Only add Authorization header if jwtToken exists
  const headers = {
    ...options.headers,
  };
  if (jwtToken) {
    headers['Authorization'] = `Bearer ${jwtToken}`;
  }

 

  // Ensure the URL is a string
  if (typeof url !== 'string') {
    throw new Error(`Invalid URL: ${url}`);
  }

  // If the URL doesn't start with http, prepend baseUrl
  const finalUrl = url.startsWith('http') ? url : `${baseUrl}${url.replace(/^\//, '')}`;

  return fetch(finalUrl, {
    ...options,
    headers,
  });
};

export const useAuth = () => useContext(AuthContext);