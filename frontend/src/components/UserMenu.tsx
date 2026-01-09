import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  UserCircleIcon, 
  Cog6ToothIcon, 
  ArrowRightOnRectangleIcon,
  UserIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';

const UserMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuthStore();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  // Default user info if no user data available
  const userInfo = user || {
    full_name: 'Admin User',
    email: 'admin@agisfl.com',
    role: 'Administrator',
    avatar: null
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* User Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="User menu"
      >
        <div className="flex items-center space-x-2">
          {userInfo && 'avatar' in userInfo && userInfo.avatar ? (
            <img
              src={userInfo.avatar}
              alt={userInfo.full_name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <UserCircleIcon className="w-8 h-8 text-gray-500" />
          )}
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium text-gray-900">{userInfo.full_name}</p>
            <p className="text-xs text-gray-500">{userInfo.role}</p>
          </div>
          <ChevronDownIcon className="w-4 h-4 text-gray-500" />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                {userInfo && 'avatar' in userInfo && userInfo.avatar ? (
                  <img
                    src={userInfo.avatar}
                    alt={userInfo.full_name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <UserCircleIcon className="w-10 h-10 text-gray-500" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {userInfo.full_name}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {userInfo.email}
                  </p>
                  <p className="text-xs text-gray-400">
                    {userInfo.role}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <Link
                to="/profile"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <UserIcon className="w-4 h-4 mr-3" />
                Profile
              </Link>

              <Link
                to="/settings"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Cog6ToothIcon className="w-4 h-4 mr-3" />
                Settings
              </Link>

              <div className="border-t border-gray-200 my-2"></div>

              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" />
                Sign Out
              </button>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <div className="text-xs text-gray-500 text-center">
                AgisFL Enterprise v4.0.0
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserMenu;
