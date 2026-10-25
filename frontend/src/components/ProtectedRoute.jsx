import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--cream-50)',
        flexDirection: 'column',
        gap: '1rem',
      }}>
        <div style={{
          width: '48px', height: '48px',
          border: '3px solid var(--cream-200)',
          borderTop: '3px solid var(--sage-500)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: 'var(--neutral-600)', fontSize: '0.95rem' }}>Loading FoodVerse...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
