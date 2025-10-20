import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, User, Briefcase } from 'lucide-react';
import { motion } from 'motion/react';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeToggle } from '../components/ThemeToggle';

export default function LandingPage() {
  const { isDark } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: FileText,
      bgColorLight: '#6BA3D8',
      bgColorDark: 'bg-blue-500',
      title: 'Smart Grade Analysis',
      description:
        'Upload your transcript and let our AI analyze your academic strengths and learning patterns.',
    },
    {
      icon: User,
      bgColorLight: '#B88FCC',
      bgColorDark: 'bg-purple-500',
      title: 'Archetype Discovery',
      description:
        'Discover your unique learning archetype and understand how it translates to career success.',
    },
    {
      icon: Briefcase,
      bgColorLight: '#6FB887',
      bgColorDark: 'bg-green-500',
      title: 'Professional Dossier',
      description:
        'Generate a comprehensive professional portfolio based on your academic analysis and archetype.',
    },
  ];

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDark ? 'text-gray-100' : ''
      }`}
      style={{
        backgroundColor: isDark ? '#1a1a1a' : '#FDFBF7',
        color: !isDark ? '#2d2d2d' : undefined,
      }}
    >
      {/* Background Pattern */}
      <div
        className={`fixed top-0 left-0 right-0 bottom-0 pointer-events-none z-0 transition-opacity duration-300 ${
          isScrolled ? 'opacity-[0.015]' : 'opacity-[0.008]'
        }`}
        style={{
          backgroundImage:
            'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-transparent backdrop-blur-md'
            : isDark
            ? ''
            : ''
        } ${
          isScrolled
            ? ''
            : isDark
            ? 'border-b border-gray-700/30'
            : 'border-b border-[#DACAO2]/60'
        }`}
        style={{
          backgroundColor: !isScrolled && isDark ? '#1a1a1a' : !isScrolled && !isDark ? '#FAF3E0' : undefined,
        }}
      >
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 flex items-center justify-between py-6 lg:py-8">
            <div className="flex items-center">
            <img src="/logo.png" alt="Gradalyze Logo" className="h-12 lg:h-14 w-auto" />
            </div>
          <div className="flex items-center gap-8 lg:gap-10 xl:gap-12">
            <ThemeToggle />
              <Link 
                to="/login" 
              className={`px-6 py-3 rounded-lg text-base font-medium transition-colors duration-200 ${
                isDark
                  ? 'bg-transparent border border-gray-700 text-gray-100 hover:bg-gray-700'
                  : 'bg-white border border-[#DACAO2] hover:bg-[#F0E6D2]'
              }`}
              >
                Get Started
              </Link>
            </div>
          </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-48 pb-32 relative z-10">
      {/* Hero Section */}
        <div className="text-center mb-32 sm:mb-40 lg:mb-48">
          <motion.h1
            className="mb-8 sm:mb-12 px-4 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <span className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold">
              Transform Your{' '}
            </span>
            <motion.span
              className={`text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold ${
                isDark ? 'text-red-400' : 'text-red-600'
              }`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
                Academic Record
            </motion.span>
            <span className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold">
              {' '}
              Into Career Success
            </span>
          </motion.h1>

          <motion.p
            className={`max-w-4xl mx-auto mb-12 sm:mb-16 px-4 text-lg sm:text-xl lg:text-2xl leading-relaxed ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
          >
            Upload your transcript, discover your learning archetype, and get
            personalized career recommendations and academic insights.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6, ease: 'easeOut' }}
          >
              <Link 
                to="/login"
              className="inline-block bg-red-600 hover:bg-red-700 text-white border-none px-8 py-4 rounded-xl text-lg font-semibold cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-xl"
              >
                Start Your Analysis
              </Link>
          </motion.div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12 max-w-7xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const iconBgColor = isDark ? feature.bgColorDark : feature.bgColorLight;

            return (
              <motion.div
                key={index}
                className={`rounded-2xl p-10 lg:p-12 text-center transition-all duration-300 hover:-translate-y-2 hover:scale-105 hover:shadow-2xl hover:border-red-400/30 ${
                  isDark
                    ? 'border border-gray-700'
                    : 'border border-[#DACAO2]'
                }`}
                style={{
                  backgroundColor: isDark ? '#2c2c2c' : '#FFFFFF',
                }}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.6 + index * 0.1,
                  duration: 0.5,
                  ease: 'easeOut',
                }}
                whileHover={{
                  y: -8,
                  scale: 1.05,
                  boxShadow: isDark
                    ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    : '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                }}
              >
                <div className="flex justify-center mb-6 lg:mb-8">
                  <motion.div
                    className={`w-16 h-16 lg:w-20 lg:h-20 rounded-xl flex items-center justify-center ${
                      isDark ? iconBgColor : ''
                    }`}
                    style={{
                      backgroundColor: !isDark ? iconBgColor : undefined
                    }}
                    whileHover={{
                      rotate: [0, -10, 10, -10, 0],
                      scale: 1.1,
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    <Icon className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
                  </motion.div>
                </div>
                <h3
                  className={`mb-4 lg:mb-6 text-xl lg:text-2xl font-semibold ${
                    isDark ? 'text-gray-100' : ''
                  }`}
                >
                  {feature.title}
                </h3>
                <p
                  className={`text-lg lg:text-xl leading-relaxed ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer
        className={`border-t mt-24 lg:mt-32 ${
          isDark ? 'border-gray-700' : 'border-[#DACAO2]'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12 lg:py-16">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6 lg:gap-8">
            <div className="flex items-center">
              <img src="/logo.png" alt="Gradalyze Logo" className="h-8 lg:h-10 w-auto" />
              </div>
            <p
              className={`text-base lg:text-lg ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              © 2025 Gradalyze. All rights reserved.
            </p>
            <div className="flex gap-8 lg:gap-10">
              <a
                href="#"
                className={`text-base lg:text-lg transition-colors duration-200 hover:text-red-600 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                Privacy
              </a>
              <a
                href="#"
                className={`text-base lg:text-lg transition-colors duration-200 hover:text-red-600 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                Terms
              </a>
              <a
                href="#"
                className={`text-base lg:text-lg transition-colors duration-200 hover:text-red-600 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
