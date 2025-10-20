import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getApiUrl } from '../config/api';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeToggle } from '../components/ThemeToggle';

const SettingsPage = () => {
  const { isDark } = useTheme();
  const [user, setUser] = useState({
    name: '',
    email: '',
    course: '',
    student_number: ''
  });

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        // Try to refresh from backend to ensure student_number is present
        if (parsed.email) {
          fetch(`${getApiUrl('PROFILE_BY_EMAIL')}?email=${encodeURIComponent(parsed.email)}`)
            .then(r => r.ok ? r.json() : null)
            .then(data => {
              if (data && data.email) {
                setUser(data);
                localStorage.setItem('user', JSON.stringify(data));
              }
            })
            .catch(() => {});
        }
      } catch {
        // ignore
      }
    }
  }, []);

  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'text-gray-100' : ''
    }`} style={{
      backgroundColor: isDark ? '#1a1a1a' : '#FDFBF7',
      color: !isDark ? '#2d2d2d' : undefined
    }}>
      {/* Navigation */}
      <nav className={`sticky top-0 z-50 border-b ${
        isDark ? 'border-gray-700/30' : 'border-[#DACAO2]'
      }`} style={{
        backgroundColor: isDark ? '#1a1a1a' : '#FAF3E0'
      }}>
        <div className="w-full px-6 sm:px-8 lg:px-10 xl:px-12">
          <div className="flex justify-between items-center h-16">
            {/* Logo Section */}
            <div className="flex items-center space-x-2">
              <img
                src="/logo.png"
                alt="Gradalyze Logo"
                className="h-10 w-auto cursor-pointer"
                onClick={() => window.location.href = '/'}
              />
            </div>

            {/* Right Controls */}
            <div className="flex items-center space-x-6">
              {/* Theme Toggle */}
              <div className="flex items-center justify-center scale-100 md:scale-105">
                <ThemeToggle />
              </div>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center space-x-3 hover:bg-[#364153]/50 rounded-lg px-3 py-2 text-sm font-medium transition-all"
                >
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-semibold text-white">
                      {user.name.split(' ').map((n) => n[0]).join('')}
                    </span>
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-xs font-medium">{user.name}</p>
                    <p className="text-xs text-gray-400">{user.course}</p>
                  </div>
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showProfileDropdown && (
                  <div 
                    className={`absolute right-0 mt-3 w-full rounded-xl border shadow-lg z-50 ${
                      isDark ? 'border-gray-700' : 'border-[#DACAO2]'
                    }`}
                    style={{ backgroundColor: isDark ? '#2c2c2c' : '#FFFFFF' }}
                  >
                    <div className="py-2">
                      <div className={`px-5 py-3 border-b ${isDark ? 'border-gray-700' : 'border-[#DACAO2]'}`}>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{user.name}</p>
                        <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>{user.email}</p>
                      </div>
                      <Link
                        to="/dashboard"
                        className={`block w-full text-left px-5 py-2.5 text-sm font-medium transition-colors ${
                          isDark ? 'text-gray-300 hover:bg-[#364153]' : 'text-gray-700 hover:bg-[#F0E6D2]'
                        }`}
                        onClick={() => setShowProfileDropdown(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        to="/analysis"
                        className={`block w-full text-left px-5 py-2.5 text-sm font-medium transition-colors ${
                          isDark ? 'text-gray-300 hover:bg-[#364153]' : 'text-gray-700 hover:bg-[#F0E6D2]'
                        }`}
                        onClick={() => setShowProfileDropdown(false)}
                      >
                        Analysis Results
                      </Link>
                      <Link
                        to="/dossier"
                        className={`block w-full text-left px-5 py-2.5 text-sm font-medium transition-colors ${
                          isDark ? 'text-gray-300 hover:bg-[#364153]' : 'text-gray-700 hover:bg-[#F0E6D2]'
                        }`}
                        onClick={() => setShowProfileDropdown(false)}
                      >
                        My Dossier
                      </Link>
                      <Link
                        to="/settings"
                        className={`block w-full text-left px-5 py-2.5 text-sm font-medium transition-colors ${
                          isDark ? 'text-gray-300 hover:bg-[#364153]' : 'text-gray-700 hover:bg-[#F0E6D2]'
                        }`}
                        onClick={() => setShowProfileDropdown(false)}
                      >
                        Settings
                      </Link>
                      <div className={`mt-2 pt-2 border-t ${isDark ? 'border-gray-700' : 'border-[#DACAO2]'}`}>
                        <button
                          onClick={() => {
                            localStorage.removeItem('auth_token');
                            localStorage.removeItem('user');
                            window.location.href = '/login';
                          }}
                          className={`block w-full text-left px-5 py-2.5 text-sm font-medium transition-colors ${
                            isDark ? 'text-red-400 hover:bg-[#364153]' : 'text-red-600 hover:bg-[#F0E6D2]'
                          }`}
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className={`rounded-lg border p-8 ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-[#DACAO2]'
        }`} style={{
          backgroundColor: isDark ? '#2c2c2c' : '#FFFFFF'
        }}>
          <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Settings</h2>
          <div className="space-y-6">
            {/* Profile Settings */}
            <div className={`border-b pb-6 ${
              isDark ? 'border-gray-700' : 'border-gray-300'
            }`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Profile Information</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-base font-medium mb-3 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>Full Name</label>
                  <input 
                    type="text" 
                    value={user.name}
                    className={`w-full px-4 py-3 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      isDark 
                        ? 'bg-[#333537] border-[#646465] text-white placeholder-gray-400'
                        : 'bg-white border-[#DACAO2] text-gray-900 placeholder-gray-500'
                    }`}
                    readOnly
                  />
                </div>
                <div>
                  <label className={`block text-base font-medium mb-3 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>Email</label>
                  <input 
                    type="email" 
                    value={user.email}
                    className={`w-full px-4 py-3 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      isDark 
                        ? 'bg-[#333537] border-[#646465] text-white placeholder-gray-400'
                        : 'bg-white border-[#DACAO2] text-gray-900 placeholder-gray-500'
                    }`}
                    readOnly
                  />
                </div>
                <div>
                  <label className={`block text-base font-medium mb-3 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>Course</label>
                  <input 
                    type="text" 
                    value={user.course}
                    className={`w-full px-4 py-3 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      isDark 
                        ? 'bg-[#333537] border-[#646465] text-white placeholder-gray-400'
                        : 'bg-white border-[#DACAO2] text-gray-900 placeholder-gray-500'
                    }`}
                    readOnly
                  />
                </div>
                <div>
                  <label className={`block text-base font-medium mb-3 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>Student Number</label>
                  <input 
                    type="text" 
                    value={user.student_number}
                    className={`w-full px-4 py-3 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      isDark 
                        ? 'bg-[#333537] border-[#646465] text-white placeholder-gray-400'
                        : 'bg-white border-[#DACAO2] text-gray-900 placeholder-gray-500'
                    }`}
                    readOnly
                  />
                </div>
              </div>
            </div>

            

            {/* Account Actions */}
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Account Actions</h3>
              <div className="space-y-3">
                {/* Download My Data removed per request */}
                {/* Reset Recommendations removed per request */}
                <button className={`w-full text-center px-4 py-3 text-lg rounded-lg transition-colors ${
                  isDark 
                    ? 'bg-red-900 hover:bg-red-800 text-white'
                    : 'bg-red-500 hover:bg-red-400 text-white'
                }`}>
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
