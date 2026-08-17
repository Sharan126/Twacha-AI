import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '100vh', width: '100vw' }}>
        <Loader2 size={40} className="spinner text-primary" />
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
