import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, MapPin, Settings, User, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface NavigationProps {
  className?: string;
}

export const Navigation: React.FC<NavigationProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      path: '/',
      label: 'Dashboard',
      icon: Home,
      description: 'Main dashboard'
    },
    {
      path: '/attendance',
      label: 'Attendance',
      icon: Calendar,
      description: 'Mark & view attendance'
    },
    {
      path: '/locations',
      label: 'Locations',
      icon: MapPin,
      description: 'Manage locations'
    },
    {
      path: '/permissions',
      label: 'Permissions',
      icon: Settings,
      description: 'App permissions'
    }
  ];

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  return (
    <Card className={`border-0 shadow-md bg-white/90 backdrop-blur-sm ${className}`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Navigation</h3>
          <Badge variant="outline" className="text-xs">
            Quick Access
          </Badge>
        </div>
        
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActivePath(item.path);
            
            return (
              <Button
                key={item.path}
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start gap-3 h-12 ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'hover:bg-blue-50 hover:text-blue-700'
                }`}
                onClick={() => navigate(item.path)}
              >
                <Icon className="h-4 w-4" />
                <div className="flex-1 text-left">
                  <div className="font-medium">{item.label}</div>
                  <div className={`text-xs ${
                    isActive ? 'text-blue-100' : 'text-muted-foreground'
                  }`}>
                    {item.description}
                  </div>
                </div>
                {isActive && (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </Button>
            );
          })}
        </nav>
      </div>
    </Card>
  );
};
