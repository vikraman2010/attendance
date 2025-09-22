import React, { useState, useEffect } from 'react';
import { Clock, Calendar, MapPin, User, Bell, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  studentId?: string;
  showNotifications?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  title = "STUDENT ATTENDANCE DASHBOARD", 
  subtitle = "Location-based Attendance System",
  studentId,
  showNotifications = true 
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentLocation, setCurrentLocation] = useState<string>('Fetching location...');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Get current location for display
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        },
        () => {
          setCurrentLocation('Location unavailable');
        }
      );
    }
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCurrentPeriodStatus = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    // Period timings (in minutes from midnight)
    const periods = [
      { name: 'Period 1', start: 8 * 60 + 45, end: 9 * 60 + 45 },
      { name: 'Period 2', start: 9 * 60 + 45, end: 10 * 60 + 35 },
      { name: 'Break', start: 10 * 60 + 35, end: 10 * 60 + 55 },
      { name: 'Period 3', start: 10 * 60 + 55, end: 11 * 60 + 45 },
      { name: 'Period 4', start: 11 * 60 + 45, end: 12 * 60 + 35 },
      { name: 'Lunch', start: 12 * 60 + 35, end: 13 * 60 + 45 },
      { name: 'Period 5', start: 13 * 60 + 45, end: 14 * 60 + 35 },
      { name: 'Period 6', start: 14 * 60 + 35, end: 15 * 60 + 25 },
      { name: 'Period 7', start: 15 * 60 + 25, end: 16 * 60 + 15 }
    ];

    for (const period of periods) {
      if (currentTimeInMinutes >= period.start && currentTimeInMinutes <= period.end) {
        const remainingMinutes = period.end - currentTimeInMinutes;
        return {
          current: period.name,
          remaining: remainingMinutes,
          status: 'active'
        };
      }
    }

    // Find next period
    for (const period of periods) {
      if (currentTimeInMinutes < period.start) {
        const minutesUntil = period.start - currentTimeInMinutes;
        return {
          current: period.name,
          remaining: minutesUntil,
          status: 'upcoming'
        };
      }
    }

    return {
      current: 'School Hours Ended',
      remaining: 0,
      status: 'ended'
    };
  };

  const periodStatus = getCurrentPeriodStatus();

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white">
      <div className="p-6">
        <div className="flex items-center justify-between">
          {/* Left Section - Title and Subtitle */}
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{title}</h1>
              <p className="text-blue-100 text-sm">{subtitle}</p>
            </div>
          </div>

          {/* Center Section - Time and Date */}
          <div className="text-center">
            <div className="text-3xl font-mono font-bold text-white mb-1">
              {formatTime(currentTime)}
            </div>
            <div className="text-blue-100 text-sm">
              {formatDate(currentTime)}
            </div>
          </div>

          {/* Right Section - Status and Controls */}
          <div className="flex items-center space-x-4">
            {/* Current Period Status */}
            <div className="text-right">
              <div className="flex items-center justify-end space-x-2 mb-1">
                <Calendar className="h-4 w-4 text-blue-200" />
                <span className="text-sm font-medium text-white">
                  {periodStatus.current}
                </span>
              </div>
              {periodStatus.status === 'active' && (
                <div className="text-xs text-blue-200">
                  {periodStatus.remaining} min remaining
                </div>
              )}
              {periodStatus.status === 'upcoming' && (
                <div className="text-xs text-blue-200">
                  Starts in {periodStatus.remaining} min
                </div>
              )}
            </div>

            {/* User Info */}
            {studentId && (
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <User className="h-3 w-3 mr-1" />
                {studentId}
              </Badge>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-2">
              {showNotifications && (
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                  <Bell className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Section - Location and Status Bar */}
        <div className="mt-4 pt-4 border-t border-white/20">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1 text-blue-200">
                <MapPin className="h-3 w-3" />
                <span>Location: {currentLocation}</span>
              </div>
              <Badge 
                variant="outline" 
                className={`border-white/30 text-xs ${
                  periodStatus.status === 'active' 
                    ? 'bg-green-500/20 text-green-100' 
                    : periodStatus.status === 'upcoming'
                    ? 'bg-yellow-500/20 text-yellow-100'
                    : 'bg-gray-500/20 text-gray-100'
                }`}
              >
                {periodStatus.status === 'active' ? 'Active Period' : 
                 periodStatus.status === 'upcoming' ? 'Break Time' : 'After Hours'}
              </Badge>
            </div>
            <div className="text-blue-200 text-xs">
              System Status: Online • Last Updated: {formatTime(currentTime)}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
