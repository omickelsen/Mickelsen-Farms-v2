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
      
      if (!jwtToken) {
        console.log('No token found in localStorage - skipping verification');
        setLoading(false);
        return; // Exit early if no token
      }
      
      try {
        console.log('Attempting to verify token...');
        // Use direct fetch instead of fetchWithToken to avoid circular dependency
        const baseUrl = process.env.NODE_ENV === 'production' 
          ? 'https://mickelsen-family-farms.herokuapp.com' 
          : 'http://localhost:5000';
        
        const response = await fetch(`${baseUrl}/api/verify-token`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${jwtToken}`,
            'Content-Type': 'application/json'
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Token verified successfully:', data);
          setIsAdmin(data.isAdmin);
          setUser({ email: data.email });
        } else {
          const errorText = await response.text();
          console.error(`Token verification failed with status: ${response.status}`, errorText);
          // Clear invalid token
          localStorage.removeItem('jwtToken');
          setToken(null);
          setUser(null);
          setIsAdmin(false);
          throw new Error(`Token verification failed: ${errorText}`);
        }
      } catch (err) {
        console.error('Auth error:', err.message);
        setError(err.message);
        // Make sure token is cleared in catch block too
        localStorage.removeItem('jwtToken');
        setToken(null);
        setUser(null);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [token]); // Ensure this runs whenever the token changes

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

  const value = {
    token,
    setToken,
    user,
    logout,
    loading,
    error,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
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
    'Content-Type': options.headers?.['Content-Type'] || 'application/json',
  };
  
  if (jwtToken) {
    headers['Authorization'] = `Bearer ${jwtToken}`;
  }

  if (typeof url !== 'string') {
    throw new Error(`Invalid URL: ${url}`);
  }

  const finalUrl = url.startsWith('http') ? url : `${baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'}${url.replace(/^\//, '')}`;
  
  console.log(`Fetching ${options.method || 'GET'} ${finalUrl} with auth token: ${jwtToken ? 'present' : 'none'}`);

  try {
    const response = await fetch(finalUrl, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Fetch error: ${response.status} ${response.statusText}`, errorBody);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorBody}`);
    }
    
    return response;
  } catch (err) {
    console.error('Fetch error:', err.message);
    throw err;
  }
};

export const useAuth = () => useContext(AuthContext);