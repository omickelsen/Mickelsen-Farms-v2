import { useState, useEffect, useContext } from 'react';
import { AuthContext, fetchWithToken } from '../context/AuthContext';

  function Admin() {
    const { token, logout, isAdmin } = useContext(AuthContext);
  
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