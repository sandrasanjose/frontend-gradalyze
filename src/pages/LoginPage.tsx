import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getApiUrl } from '../config/api';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeToggle } from '../components/ThemeToggle';

const LoginPage = () => {
  const { isDark } = useTheme();
  const [isLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(getApiUrl('LOGIN'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Login failed');

      console.log('Login response:', result);
      localStorage.setItem('auth_token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      console.log('Login successful, redirecting to dashboard...');
      navigate('/dashboard');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 flex items-center justify-center px-4 ${
      isDark ? 'text-gray-100' : ''
    }`} style={{
      backgroundColor: isDark ? '#1a1a1a' : '#FDFBF7',
      color: !isDark ? '#2d2d2d' : undefined
    }}>
      {/* Back to home (fixed top-left) */}
      <Link to="/" className={`fixed top-4 left-4 inline-flex items-center gap-2 px-6 py-3 rounded-lg text-base font-medium transition-colors duration-200 ${
        isDark 
          ? 'bg-transparent border border-gray-700 text-gray-100 hover:bg-gray-700' 
          : 'bg-white border border-[#DACAO2] hover:bg-[#F0E6D2] text-gray-700'
      }`}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Back to home
      </Link>
      
      {/* Theme Toggle (fixed top-right) */}
      <div className="fixed top-4 right-4">
        <ThemeToggle />
 
      </div>

      <div className="max-w-lg w-full">

        {/* Logo */}
        <div className="text-center mb-10">
          <img 
            src="/logo.png" 
            alt="Gradalyze Logo" 
            className="h-12 mx-auto mb-6"
          />
          <h1 className="text-3xl font-bold mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-lg text-gray-400 mb-6">
            {isLogin ? 'Sign in to your account' : 'Join Gradalyze today'}
          </p>
          <div className={`p-4 rounded-lg border ${
            isDark 
              ? 'border-gray-700' 
              : 'border-[#DACAO2]'
          }`} style={{
            backgroundColor: isDark ? '#2c2c2c' : '#FFFFFF'
          }}>
            <p className={`text-sm ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>Sign in with the email and password you used during signup.</p>
          </div>
        </div>

        {/* Form */}
        <div className={`rounded-xl border p-10 ${
          isDark 
            ? 'border-gray-700' 
            : 'border-[#DACAO2]'
        }`} style={{
          backgroundColor: isDark ? '#2c2c2c' : '#FFFFFF'
        }}>
          <form onSubmit={handleSubmit} className="space-y-8">
            {!isLogin && (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className={`block text-base font-medium mb-3 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      isDark 
                        ? 'bg-[#333537] border-[#646465] text-white placeholder-gray-400'
                        : 'bg-white border-[#DACAO2] text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="John"
                    required={!isLogin}
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className={`block text-base font-medium mb-3 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      isDark 
                        ? 'bg-[#333537] border-[#646465] text-white placeholder-gray-400'
                          : 'bg-white border-[#DACAO2] text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Doe"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className={`block text-base font-medium mb-3 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                PLM School Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={isLoading}
                className={`w-full px-4 py-3 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                  isDark 
                    ? 'bg-[#333537] border-[#646465] text-white placeholder-gray-400'
                      : 'bg-white border-[#DACAO2] text-gray-900 placeholder-gray-500'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                placeholder="juandelacruz@plm.edu.ph"
                required
              />
            </div>

            {/* Removed duplicate email input to avoid non-unique id and simplify login to email+password */}

            <div>
              <label htmlFor="password" className={`block text-base font-medium mb-3 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className={`w-full px-4 py-3 pr-12 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                    isDark 
                      ? 'bg-[#333537] border-[#646465] text-white placeholder-gray-400'
                        : 'bg-white border-[#DACAO2] text-gray-900 placeholder-gray-500'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 focus:outline-none ${
                    isLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                  }`}
                >
                  {showPassword ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className={`block text-base font-medium mb-3 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                    isDark 
                      ? 'bg-black border-gray-700 text-white placeholder-gray-400' 
                      : 'bg-white border-orange-300 text-gray-900 placeholder-gray-500'
                  }`}
                  placeholder="••••••••"
                  required={!isLogin}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full px-6 py-3 rounded-lg text-base font-medium transition-colors duration-200 ${
                isLoading 
                  ? 'bg-gray-600 text-gray-300 cursor-not-allowed' 
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing In...</span>
                </div>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          {/* Redirect to dedicated signup page */}
          <div className="mt-8 text-center">
            <p className={`text-lg ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Don't have an account?{' '}
              <Link to="/signup" className="text-red-600 hover:text-red-700 font-semibold text-lg transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
