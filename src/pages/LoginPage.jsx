import React, { useState, useEffect, useMemo } from 'react';
import { Zap } from 'lucide-react';
import sanityClient from '../sanityClient'; // Sanity client import karaganna

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // WENAS KAMA: Sanity eka check karana aluth logic eka
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
        const query = `*[_type == "adminUser" && username.current == $username && password == $password][0]`;
        const params = { username, password };
        const adminUser = await sanityClient.fetch(query, params);

        if (adminUser) {
            // User hari nam, login karanawa
            onLogin();
        } else {
            setError('Invalid username or password.');
        }
    } catch (err) {
        console.error("Login failed:", err);
        setError('An error occurred. Please try again.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
            <div className="login-box">
                {/* WENAS KAMA: Icon eka wenuwata logo eka demma */}
                <img src="/logo.png" alt="RapidGo Logo" className="login-logo" />
                <h2>Admin Panel</h2>
                <p>Sign in to manage your services</p>
                <form className="login-form" onSubmit={handleLogin}>
                    <div className="form-group"><label>Username</label><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required /></div>
                    <div className="form-group"><label>Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
                    {error && <p className="error-message">{error}</p>}
                    <button type="submit" className="btn-login" disabled={isLoading}>{isLoading ? 'Logging in...' : 'Login'}</button>
                </form>
            </div>
        </div>
  );
}