import { Navigate, useLocation } from 'react-router-dom';
import { ReactNode, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface AdminProtectedRouteProps {
  children: ReactNode;
}

export const AdminProtectedRoute = ({ children }: AdminProtectedRouteProps) => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    const accessToken = localStorage.getItem('accessToken');
    const userRole = localStorage.getItem('userRole');

    if (!accessToken) {
      setIsLoading(false);
      return;
    }

    // Quick check from localStorage
    if (userRole === 'admin') {
      setIsAdmin(true);
      setIsLoading(false);
      return;
    }

    // Verify with backend
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user?.role === 'admin') {
          localStorage.setItem('userRole', 'admin');
          setIsAdmin(true);
        }
      }
    } catch (error) {
      console.error('Failed to verify admin status:', error);
    }

    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
