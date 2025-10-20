import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getApiUrl } from '../config/api';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeToggle } from '../components/ThemeToggle';

const SignUpPage = () => {
  const { isDark } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    extension: '',
    studentNumber: '',
    course: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const navigate = useNavigate();

  // Sanitizers
  const onlyLetters = (v: string) => v.replace(/[^a-zA-Z\s\-']/g, '');
  const onlyLettersCompact = (v: string) => v.replace(/[^a-zA-Z]/g, '');
  const onlyDigits = (v: string) => v.replace(/[^0-9]/g, '');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let sanitized = value;

    switch (name) {
      case 'firstName':
      case 'middleName':
      case 'lastName':
        sanitized = onlyLetters(value);
        break;
      case 'extension':
        sanitized = onlyLettersCompact(value).toUpperCase().slice(0, 5);
        break;
      case 'studentNumber':
        sanitized = onlyDigits(value).slice(0, 9);
        break;
      case 'email':
        sanitized = value.replace(/[^a-zA-Z0-9@._+-]/g, '');
        break;
      default:
        break;
    }

    setFormData({ ...formData, [name]: sanitized });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    try {
      const response = await fetch(getApiUrl('SIGNUP'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          middleName: formData.middleName.trim(),
          lastName: formData.lastName.trim(),
          extension: formData.extension.trim(),
          studentNumber: formData.studentNumber.trim(),
          course: formData.course,
          email: formData.email.trim(),
          password: formData.password,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Registration failed');
      }

      alert('Registration successful! Please sign in.');
      navigate('/login');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Something went wrong during registration';
      alert(errorMessage);
    }
  };

  const courses = ['BS Information Technology', 'BS Computer Science'];

  return (
    <div
      className={`min-h-screen py-8 px-4 transition-colors duration-300 ${
        isDark ? 'text-gray-100' : ''
      }`}
      style={{
        backgroundColor: isDark ? '#1a1a1a' : '#FDFBF7',
        color: !isDark ? '#2d2d2d' : undefined,
      }}
    >
      {/* Back to home */}
      <Link
        to="/"
        className={`fixed top-4 left-4 inline-flex items-center gap-2 px-6 py-3 rounded-lg text-base font-medium transition-colors duration-200 ${
          isDark
            ? 'bg-transparent border border-gray-700 text-gray-100 hover:bg-[#2c2c2c]'
            : 'bg-white border border-[#DACAO2] hover:bg-[#F0E6D2] text-gray-700'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to home
      </Link>

      {/* Theme Toggle */}
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <img src="/logo.png" alt="Gradalyze Logo" className="h-12 mx-auto mb-4" />
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-red-600'}`}>
            Create Account
          </h1>
        </div>

        {/* Form Card */}
        <div
          className={`rounded-xl border p-10 ${isDark ? 'border-gray-700' : 'border-[#DACAO2]'}`}
          style={{ backgroundColor: isDark ? '#2c2c2c' : '#FFFFFF' }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div>
              <h2
                className={`text-xl font-semibold mb-4 border-b pb-2 ${
                  isDark ? 'text-white border-gray-200' : 'text-gray-900 border-gray-200'
                }`}
              >
                Personal Information
              </h2>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label
                    htmlFor="firstName"
                    className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    First Name*
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`appearance-none w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      isDark
                        ? 'bg-[#333537] border-[#646465] text-white'
                        : 'bg-white border-[#DACAO2] text-gray-900'
                    }`}
                    placeholder="Juan"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="middleName"
                    className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    Middle Name
                  </label>
                  <input
                    type="text"
                    id="middleName"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleInputChange}
                    className={`appearance-none w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      isDark
                        ? 'bg-[#333537] border-[#646465] text-white'
                        : 'bg-white border-[#DACAO2] text-gray-900'
                    }`}
                    placeholder="Protacio"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="lastName"
                    className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    Last Name*
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`appearance-none w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      isDark
                        ? 'bg-[#333537] border-[#646465] text-white'
                        : 'bg-white border-[#DACAO2] text-gray-900'
                    }`}
                    placeholder="Dela Cruz"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="extension"
                    className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    Ext. (e.g. III, Sr.)
                  </label>
                  <input
                    type="text"
                    id="extension"
                    name="extension"
                    value={formData.extension}
                    onChange={handleInputChange}
                    className={`appearance-none w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      isDark
                        ? 'bg-[#333537] border-[#646465] text-white'
                        : 'bg-white border-[#DACAO2] text-gray-900'
                    }`}
                    placeholder="Jr."
                  />
                </div>
              </div>
            </div>

            {/* Student Information */}
            <div>
              <h2 className={`text-xl font-semibold mb-4 border-b pb-2 ${
                  isDark ? 'text-white border-gray-200' : 'text-gray-900 border-gray-200'
                }`}
              >
                Student Information
              </h2>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label
                    htmlFor="studentNumber"
                    className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    Student Number*
                  </label>
                  <input
                    type="text"
                    id="studentNumber"
                    name="studentNumber"
                    value={formData.studentNumber}
                    onChange={handleInputChange}
                    inputMode="numeric"
                    maxLength={9}
                    className={`appearance-none w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      isDark
                        ? 'bg-[#333537] border-[#646465] text-white'
                        : 'bg-white border-[#DACAO2] text-gray-900'
                    }`}
                    placeholder="202512345"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="course"
                    className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    Course*
                  </label>
                  <select
                    id="course"
                    name="course"
                    value={formData.course}
                    onChange={handleInputChange}
                    className={`appearance-none w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      isDark
                        ? 'bg-[#333537] border-[#646465] text-white'
                        : 'bg-white border-[#DACAO2] text-gray-900'
                    }`}
                    required
                  >
                    <option value="">Select your course</option>
                    {courses.map((course) => (
                      <option key={course} value={course}>
                        {course}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Email Address*
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`appearance-none w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                    isDark
                      ? 'bg-[#333537] border-[#646465] text-white'
                      : 'bg-white border-[#DACAO2] text-gray-900'
                  }`}
                  placeholder="jprizal@plm.edu.ph"
                  required
                />
              </div>
            </div>

            {/* Password Section */}
            <div>
            <h2 className={`text-xl font-semibold mb-4 border-b pb-2 ${
                  isDark ? 'text-white border-gray-200' : 'text-gray-900 border-gray-200'
                }`}
              >
                Password
              </h2>
              <div className="space-y-4">
                {/* Create Password */}
                <div>
                  <label
                    htmlFor="password"
                    className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    Create Password*
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`appearance-none w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                        isDark
                          ? 'bg-[#333537] border-[#646465] text-white placeholder-gray-400'
                          : 'bg-white border-[#DACAO2] text-gray-900 placeholder-gray-500'
                      }`}
                      placeholder="Enter Password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-red-500 focus:outline-none cursor-pointer"
                    >
                      {showPassword ? (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    Confirm Password*
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`appearance-none w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                        isDark
                          ? 'bg-[#333537] border-[#646465] text-white placeholder-gray-400'
                          : 'bg-white border-[#DACAO2] text-gray-900 placeholder-gray-500'
                      }`}
                      placeholder="Confirm Password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-red-500 focus:outline-none cursor-pointer"
                    >
                      {showConfirmPassword ? (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full px-6 py-3 rounded-lg text-base font-medium transition-colors duration-200 bg-red-600 hover:bg-red-700 text-white"
            >
              Create account
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Already have an account?{' '}
              <Link to="/login" className="text-red-600 hover:text-red-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
