import { createContext, useState, useEffect, useContext } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('googleIdToken') || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      const idToken = localStorage.getItem('googleIdToken');
      if (idToken) {
        try {
          const response = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
          if (!response.ok) throw new Error(`Token verification failed with status ${response.status}`);
          const data = await response.json();
          const ADMIN_EMAILS = ['omickelsen@gmail.com', 'mickelsenfamilyfarms@gmail.com'];
          setIsAdmin(ADMIN_EMAILS.includes(data.email));
          setUser({ email: data.email });
          setToken(idToken);
        } catch (err) {
          console.error('Token verification failed:', err.message); // Generic error message
          setError(err.message);
          localStorage.removeItem('googleIdToken');
          setToken(null);
          setUser(null);
          setIsAdmin(false);
        }
      } else {
        console.log('No token found in localStorage'); // Safe log
      }
      setLoading(false);
    };

    verifyToken();
  }, []); // Run once on mount

  const logout = () => {
    localStorage.removeItem('googleIdToken');
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
  const idToken = localStorage.getItem('googleIdToken');
  // Removed logging of token for security
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${idToken || ''}`,
  };
  return fetch(url, { ...options, headers });
};

export const useAuth = () => useContext(AuthContext);