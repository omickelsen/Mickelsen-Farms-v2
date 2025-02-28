import { createContext, useState, useEffect, useContext } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const idToken = window.localStorage.getItem('googleIdToken');
    console.log('Stored token:', idToken); // Debug log
    if (idToken && !token) {
      setToken(idToken);
      verifyAdmin(idToken);
      setLoading(false);
    }
  }, [token]);

  const verifyAdmin = async (idToken) => {
    try {
      const response = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${idToken}`);
      const data = await response.json();
      console.log('Token data:', data); // Debug log
      const ADMIN_EMAILS = ['omickelsen@gmail.com', 'mickelsenfamilyfarms@gmail.com']; // Ensure this matches
      setIsAdmin(ADMIN_EMAILS.includes(data.email));
      setUser({ email: data.email });
      console.log('Is Admin:', ADMIN_EMAILS.includes(data.email), 'Email:', data.email); // Debug log
    } catch (err) {
      console.error('Error verifying admin:', err);
      setError(err.message);
    }
  };

  const logout = () => {
    window.localStorage.removeItem('googleIdToken');
    setToken(null);
    setUser(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ token, setToken, user, logout, loading, error, isAdmin }}>
      {loading ? <p>Loading...</p> : error ? <p>Error: {error}</p> : children}
    </AuthContext.Provider>
  );
};

export const fetchWithToken = async (url, options = {}) => {
  const idToken = window.localStorage.getItem('googleIdToken');
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${idToken}`,
  };
  return fetch(url, { ...options, headers });
};

export const useAuth = () => useContext(AuthContext);