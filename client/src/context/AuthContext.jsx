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
  // Determine base URL dynamically
  let baseUrl;
  if (typeof window !== 'undefined') {
    baseUrl = `${window.location.protocol}//${window.location.host}`;
  } else if (process.env.NODE_ENV === 'production') {
    baseUrl = 'https://mickelsenfamilyfarms.com'; // Fallback to custom domain
  } else {
    baseUrl = 'http://localhost:5000'; // Fallback for server-side rendering or local dev
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

  const finalUrl = url.startsWith('http') ? url : `${baseUrl}${url.replace(/^\//, '')}`;
  console.log('Fetching from:', finalUrl); // Debug log

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