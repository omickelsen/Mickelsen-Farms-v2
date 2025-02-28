import { useState, useEffect, useContext } from 'react';
import { AuthContext, fetchWithToken } from '../context/AuthContext';

const ADMIN_EMAILS = ['omickelsen@gmail.com', 'mickelsenfamilyfarms@gmail.com'];

function Admin() {
  const { token, logout } = useContext(AuthContext);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (token) {
      fetchUserEmail(token).then(email => {
        setIsAdmin(ADMIN_EMAILS.includes(email));
      }).catch(err => console.error('Error verifying admin:', err));
    }
  }, [token]);

  const fetchUserEmail = async (idToken) => {
    const response = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${idToken}`);
    const data = await response.json();
    return data.email;
  };

  if (!token || !isAdmin) {
    return <div className="py-16 text-center"><p>Please log in with an admin account.</p><div id="google-signin"></div></div>;
  }

  return (
    <div className="py-16 bg-white">
      <h2 className="section-title">Admin Dashboard</h2>
      <button onClick={logout} className="btn-primary mt-4">
        Logout
      </button>
    </div>
  );
}

export default Admin;