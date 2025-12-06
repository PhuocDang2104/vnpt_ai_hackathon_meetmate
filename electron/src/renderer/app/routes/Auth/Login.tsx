/**
 * Login Page
 */
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import { login, getCurrentUser, storeUser } from '../../../lib/api/auth';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email, password });
      const user = await getCurrentUser();
      storeUser(user);
      navigate('/app');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <Link to="/" className="auth-logo-link">
            <h1 className="auth-logo">MeetMate</h1>
          </Link>
          <p className="auth-subtitle">AI-Powered Meeting Assistant</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <h2 className="auth-title">Đăng nhập</h2>

          {error && (
            <div className="auth-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <div className="input-with-icon">
              <Mail size={18} />
              <input
                id="email"
                type="email"
                placeholder="your.email@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <div className="input-with-icon">
              <Lock size={18} />
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? (
              <span>Đang đăng nhập...</span>
            ) : (
              <>
                <LogIn size={18} />
                <span>Đăng nhập</span>
              </>
            )}
          </button>

          <div className="auth-footer">
            <p>
              Chưa có tài khoản?{' '}
              <Link to="/register">Đăng ký ngay</Link>
            </p>
          </div>
        </form>

        <div className="auth-demo-info">
          <p><strong>Demo Account:</strong></p>
          <p>Email: nguyenvana@lpbank.vn</p>
          <p>Password: demo123</p>
        </div>
      </div>

      <style>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-base);
          padding: var(--space-lg);
        }

        .auth-container {
          width: 100%;
          max-width: 420px;
        }

        .auth-header {
          text-align: center;
          margin-bottom: var(--space-xl);
        }

        .auth-logo-link {
          text-decoration: none;
        }

        .auth-logo {
          font-family: var(--font-heading);
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--accent);
          margin: 0;
        }

        .auth-subtitle {
          color: var(--text-secondary);
          margin-top: var(--space-xs);
        }

        .auth-form {
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: var(--space-xl);
        }

        .auth-title {
          font-family: var(--font-heading);
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 var(--space-lg);
          text-align: center;
        }

        .auth-error {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          padding: var(--space-sm);
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: var(--radius-sm);
          color: #ef4444;
          font-size: 0.875rem;
          margin-bottom: var(--space-md);
        }

        .form-group {
          margin-bottom: var(--space-md);
        }

        .form-group label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: var(--space-xs);
        }

        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-with-icon svg {
          position: absolute;
          left: var(--space-sm);
          color: var(--text-secondary);
        }

        .input-with-icon input {
          width: 100%;
          padding: var(--space-sm) var(--space-sm) var(--space-sm) 2.5rem;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          font-size: 1rem;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .input-with-icon input:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .input-with-icon input::placeholder {
          color: var(--text-secondary);
          opacity: 0.6;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-xs);
          padding: var(--space-sm) var(--space-md);
          border-radius: var(--radius-sm);
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .btn-primary {
          background: var(--accent);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: var(--accent-hover);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-block {
          width: 100%;
          margin-top: var(--space-md);
        }

        .auth-footer {
          margin-top: var(--space-lg);
          text-align: center;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .auth-footer a {
          color: var(--accent);
          text-decoration: none;
          font-weight: 500;
        }

        .auth-footer a:hover {
          text-decoration: underline;
        }

        .auth-demo-info {
          margin-top: var(--space-lg);
          padding: var(--space-md);
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          color: var(--text-secondary);
          text-align: center;
        }

        .auth-demo-info p {
          margin: var(--space-xs) 0;
        }
      `}</style>
    </div>
  );
};

export default Login;

