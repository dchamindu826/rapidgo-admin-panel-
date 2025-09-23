import React, { useState } from 'react';
import { client } from '../sanityClient'; // නිවැරදි import එක

// App.jsx එකෙන් එවන onLoginSuccess prop එක මෙතනට ගන්න ඕන
export default function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
        const query = `*[_type == "adminUser" && username.current == $username && password == $password][0]`;
        const params = { username, password };
        // FIX 1: 'sanityClient' වෙනුවට 'client' පාවිච්චි කරනවා
        const adminUser = await client.fetch(query, params);

        if (adminUser) {
            // FIX 2: User හරි නම්, userge data ටිකත් එක්ක onLoginSuccess එක call කරනවා
            onLoginSuccess(adminUser);
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
            <img src="/logo.png" alt="RapidGo Logo" className="login-logo" />
            <h2>Admin Panel</h2>
            <p>Sign in to manage your services</p>
            <form className="login-form" onSubmit={handleLogin}>
                <div className="form-group">
                    <label>Username</label>
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label>Password</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                {error && <p className="error-message">{error}</p>}
                <button type="submit" className="btn-login" disabled={isLoading}>
                    {isLoading ? 'Logging in...' : 'Login'}
                </button>
            </form>
        </div>
    </div>
  );
}