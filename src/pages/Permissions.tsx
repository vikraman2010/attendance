import React, { useEffect } from 'react';
import { PermissionGate } from '@/components/PermissionGate';
import { useNavigate } from 'react-router-dom';

const Permissions = () => {
  const navigate = useNavigate();

  // Auto-redirect to dashboard after permissions are granted
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/', { replace: true });
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <PermissionGate>
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Permissions granted! Redirecting to dashboard...</p>
        </div>
      </div>
    </PermissionGate>
  );
};

export default Permissions;
