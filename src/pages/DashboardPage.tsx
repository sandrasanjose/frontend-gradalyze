import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getApiUrl } from '../config/api';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeToggle } from '../components/ThemeToggle';

type User = {
  id: number;
  name: string;
  email: string;
  course: string;
  student_number: string;
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [user, setUser] = useState({
    id: 0 as number,
    name: '',
    email: '',
    course: '',
    student_number: ''
  });

  // Dynamic data states
  const [hiringCompanies, setHiringCompanies] = useState<unknown[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  
  // User archetype data
  const [userArchetype, setUserArchetype] = useState<{
    primary?: string;
    analyzedAt?: string;
    hasAnalysis?: boolean;
    archetype_realistic_percentage?: number;
    archetype_investigative_percentage?: number;
    archetype_artistic_percentage?: number;
    archetype_social_percentage?: number;
    archetype_enterprising_percentage?: number;
    archetype_conventional_percentage?: number;
  } | null>(null);
  const [archetypeLoading, setArchetypeLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchHiringCompanies = useCallback(async (email: string) => {
    setCompaniesLoading(true);
    try {
      const response = await fetch(getApiUrl('COMPANY_RECOMMENDATIONS'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (response.ok) {
        const data = await response.json();
        setHiringCompanies(data.job_recommendations?.company_recommendations || []);
      }
    } catch (error) {
      console.error('Error fetching hiring companies:', error);
    } finally {
      setCompaniesLoading(false);
    }
  }, []);

  const fetchUserArchetype = useCallback(async (email: string) => {
    setArchetypeLoading(true);
    try {
      const response = await fetch(`${getApiUrl('PROFILE_BY_EMAIL')}?email=${encodeURIComponent(email)}`);
      if (response.ok) {
        const data = await response.json();
        // store id for account actions
        setUser((prev: User) => ({ ...prev, id: typeof data.id === 'number' ? data.id : prev.id }));
        
        // Check if we have any archetype data
        const hasArchetypeData = data.archetype_realistic_percentage || 
                                data.archetype_investigative_percentage || 
                                data.archetype_artistic_percentage || 
                                data.archetype_social_percentage || 
                                data.archetype_enterprising_percentage || 
                                data.archetype_conventional_percentage;
        
        if (hasArchetypeData) {
          // Prefer normalized percentages from tor_notes if available
          try {
            if (data.tor_notes) {
              const parsed = JSON.parse(data.tor_notes);
              const arch = parsed?.analysis_results?.archetype_analysis;
              const pref = arch?.opportunity_normalized_percentages || arch?.normalized_percentages || arch?.archetype_percentages;
              if (pref && typeof pref === 'object') {
                const toNum = (v: unknown): number => {
                  const n = Number(v); return Number.isFinite(n) ? n : 0;
                };
                // Determine primary from backend if present
                let primaryArchetype = data.primary_archetype || arch?.primary_archetype;
                if (!primaryArchetype) {
                  const arr = [
                    { n: 'Realistic', v: toNum((pref as any).Realistic ?? (pref as any).realistic) },
                    { n: 'Investigative', v: toNum((pref as any).Investigative ?? (pref as any).investigative) },
                    { n: 'Artistic', v: toNum((pref as any).Artistic ?? (pref as any).artistic) },
                    { n: 'Social', v: toNum((pref as any).Social ?? (pref as any).social) },
                    { n: 'Enterprising', v: toNum((pref as any).Enterprising ?? (pref as any).enterprising) },
                    { n: 'Conventional', v: toNum((pref as any).Conventional ?? (pref as any).conventional) },
                  ];
                  primaryArchetype = arr.sort((a,b)=>b.v-a.v)[0]?.n;
                }
                const friendlyPrimary = toFriendlyArchetype(primaryArchetype);
                setUserArchetype({
                  primary: friendlyPrimary,
                  analyzedAt: data.archetype_analyzed_at,
                  hasAnalysis: true,
                  archetype_realistic_percentage: toNum((pref as any).Realistic ?? (pref as any).realistic),
                  archetype_investigative_percentage: toNum((pref as any).Investigative ?? (pref as any).investigative),
                  archetype_artistic_percentage: toNum((pref as any).Artistic ?? (pref as any).artistic),
                  archetype_social_percentage: toNum((pref as any).Social ?? (pref as any).social),
                  archetype_enterprising_percentage: toNum((pref as any).Enterprising ?? (pref as any).enterprising),
                  archetype_conventional_percentage: toNum((pref as any).Conventional ?? (pref as any).conventional),
                });
                return; // avoid fallback below
              }
            }
          } catch {}
          // Determine primary archetype from percentages if not set
          let primaryArchetype = data.primary_archetype;
          if (!primaryArchetype) {
            const archetypes = [
              { name: 'Realistic', value: data.archetype_realistic_percentage || 0 },
              { name: 'Investigative', value: data.archetype_investigative_percentage || 0 },
              { name: 'Artistic', value: data.archetype_artistic_percentage || 0 },
              { name: 'Social', value: data.archetype_social_percentage || 0 },
              { name: 'Enterprising', value: data.archetype_enterprising_percentage || 0 },
              { name: 'Conventional', value: data.archetype_conventional_percentage || 0 }
            ];
            const highest = archetypes.reduce((prev, current) => 
              (prev.value > current.value) ? prev : current
            );
            primaryArchetype = highest.name;
          }
          // Convert to friendly label that matches the sidebar naming
          const friendlyPrimary = toFriendlyArchetype(primaryArchetype);
          
          setUserArchetype({
            primary: friendlyPrimary,
            analyzedAt: data.archetype_analyzed_at,
            hasAnalysis: !!data.tor_notes || hasArchetypeData,
            archetype_realistic_percentage: data.archetype_realistic_percentage || 0,
            archetype_investigative_percentage: data.archetype_investigative_percentage || 0,
            archetype_artistic_percentage: data.archetype_artistic_percentage || 0,
            archetype_social_percentage: data.archetype_social_percentage || 0,
            archetype_enterprising_percentage: data.archetype_enterprising_percentage || 0,
            archetype_conventional_percentage: data.archetype_conventional_percentage || 0
          });
        }
      }
    } catch (error) {
      console.error('Error fetching user archetype:', error);
    } finally {
      setArchetypeLoading(false);
    }
  }, []);

  const toFriendlyArchetype = (raw: string | undefined | null) => {
    if (!raw) return undefined;
    const key = String(raw).toLowerCase().replace(/\s+/g, '_');
    const map: Record<string, string> = {
      realistic: 'Applied Practitioner',
      investigative: 'Analytical Thinker',
      artistic: 'Creative Innovator',
      social: 'Collaborative Supporter',
      enterprising: 'Strategic Leader',
      conventional: 'Methodical Organizer'
    };
    // Already friendly? return as-is
    return map[key] || raw;
  };

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        
        // Fetch dynamic data if user has email
        if (parsed.email) {
          fetchHiringCompanies(parsed.email);
          fetchUserArchetype(parsed.email);
        }
      } catch {
        // ignore parse errors
      }
    }
  }, [fetchHiringCompanies, fetchUserArchetype]);

  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [activeSection, setActiveSection] = useState('feed');
  const [showAllCompanies, setShowAllCompanies] = useState(false);
  const [showAllArchetypes, setShowAllArchetypes] = useState(false);
  
  const handleLogout = () => {
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    } finally {
      navigate('/login');
    }
  };

  const performDelete = async () => {
    if (!user?.id) { setDeleteError('User id not found'); return; }
    try {
      setDeleting(true);
      setDeleteError(null);
      const token = localStorage.getItem('auth_token') || '';
      const res = await fetch(`${getApiUrl('USERS')}/${user.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      const text = await res.text();
      let j: unknown = {}; 
      try { 
        j = text ? JSON.parse(text) : {}; 
      } catch (error) {
        console.error('Error parsing JSON:', error);
      }
      if (!res.ok) {
        const errorObj = j as { message?: string; error?: string };
        throw new Error(errorObj?.message || errorObj?.error || `Delete failed (${res.status})`);
      }
      // Clear client session and redirect
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      navigate('/login');
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to delete account';
      setDeleteError(errorMessage);
    } finally {
      setDeleting(false);
    }
  };


  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'text-gray-100' : ''
    }`} style={{
      backgroundColor: isDark ? '#1a1a1a' : '#FDFBF7',
      color: !isDark ? '#2d2d2d' : undefined
    }}>
      {/* Navigation */}
      <nav
  className={`sticky top-0 z-50 border-b ${
    isDark ? 'border-gray-700/30' : 'border-[#DACAO2]'
  }`}
  style={{
    backgroundColor: isDark ? '#1a1a1a' : '#FAF3E0',
  }}
>
        <div className="w-full px-6 sm:px-8 lg:px-10 xl:px-12">
          <div className="flex justify-between items-center h-16">
      {/* Logo Section */}
      <div className="flex items-center space-x-2">
        <img
          src="/logo.png"
          alt="Gradalyze Logo"
          className="h-10 w-auto cursor-pointer"
          onClick={() => navigate('/')}
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
      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{user.course}</p>
    </div>
    <svg
      className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
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
                          onClick={handleLogout}
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
      <main className="max-w-8xl mx-auto px-12 lg:px-14 py-6">
        {/* Hero-only view when no TOR/archetype */}
        {(!userArchetype || !userArchetype.hasAnalysis) && (
          <div className="flex items-center justify-center text-center min-h-[70vh] py-24 sm:py-32 lg:py-40">
            <div className="max-w-4xl mx-auto">
              <h1 className={`text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-8 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Welcome back, <span className="text-red-600">{(user.name || 'User').split(' ')[0]}</span>!
              </h1>
              <p className={`text-xl sm:text-2xl leading-relaxed mb-10 ${isDark ? 'text-gray-300' : 'text-gray-600'} max-w-3xl mx-auto`}>
                    Ready to discover your learning archetype? Upload your transcript to get personalized insights about your academic journey.
                  </p>
                  <Link 
                    to="/analysis"
                className="inline-flex items-center gap-3 bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl text-lg font-medium transition-colors shadow-sm"
                  >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span>Get Started</span>
                  </Link>
            </div>
          </div>
        )}
        {activeSection === 'feed' && (userArchetype && userArchetype.hasAnalysis) && (
  <div className="space-y-10 px-8 w-full">
    {/* Welcome Message - Larger, Left-Aligned */}
    <div className="text-left mb-10 pl-10">
      <h1 className={`text-5xl font-extrabold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Welcome back, <span className="text-red-600">{(user.name || 'User').split(' ')[0]}</span>!
      </h1>
      <p className={`text-2xl ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
        Here's your personalized career dashboard based on your academic profile.
      </p>
    </div>

    {/* Two Column Layout */}
    <div className="grid lg:grid-cols-[1.9fr_1.1fr] gap-3 w-full">
      {/* Left Column - Company Recommendations */}
      <div className="space-y-8 px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Company Recommendations
          </h2>
          <button
            onClick={() => user.email && (async () => {
              setCompaniesLoading(true);
              try {
                const response = await fetch(getApiUrl('COMPANY_RECOMMENDATIONS'), {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: user.email }),
                });
                if (response.ok) {
                  const data = await response.json();
                  setHiringCompanies(data.job_recommendations?.company_recommendations || []);
                }
              } catch (error) {
                console.error('Error fetching hiring companies:', error);
              } finally {
                setCompaniesLoading(false);
              }
            })()}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-lg font-medium transition-colors ${
              isDark 
                ? 'bg-[#2c2c2c] hover:bg-gray-700 text-gray-200' 
                : 'bg-[#F0E6D2] hover:bg-gray-200 text-gray-800'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Company Cards */}
        {companiesLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`h-40 rounded-xl animate-pulse ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
            ))}
          </div>
        ) : hiringCompanies.length === 0 ? (
          <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <p>No recommendations yet. Complete your analysis to see personalized insights.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {hiringCompanies.slice(0, showAllCompanies ? hiringCompanies.length : 3).map((company, idx) => {
              const c = company as {
                id?: string | number;
                title?: string;
                logo_url?: string;
                location?: string;
                roles?: string[];
                description?: string;
                open_positions?: string | number;
                url?: string;
              };
              return (
                <div
                  key={c.id ?? idx}
                  className={`rounded-xl border p-6 hover:shadow-lg transition-all cursor-pointer ${
                    isDark ? 'bg-[#2c2c2c] border-gray-700 hover:border-gray-600' : 'bg-white border-[#DACAO2] hover:border-gray-300'
                  }`}
                  onClick={() => c.url && window.open(c.url, '_blank')}
                >
                  <div className="flex items-start gap-6">
                    {/* Logo */}
                    <div className={`w-16 h-16 rounded-lg flex items-center justify-center text-xl font-bold ${
                      isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {c.logo_url ? (
                        <img
                          src={c.logo_url}
                          alt={c.title}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        (c.title || '??').split(' ').map((n) => n[0]).join('').slice(0, 2)
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <h3 className={`text-2xl font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{c.title}</h3>
                      {c.location && (
                        <p className={`text-lg mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          📍 {c.location}
                        </p>
                      )}
                      {c.roles && (
                        <div className="flex flex-wrap gap-3 mb-3">
                          {c.roles.slice(0, 3).map((role) => (
                            <span key={role} className={`px-3 py-1 rounded-lg text-base font-medium ${
                              isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {role}
                            </span>
                          ))}
                        </div>
                      )}
                      {c.description && (
                        <p className={`text-lg mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {c.description}
                        </p>
                      )}
                      {c.open_positions && (
                        <p className={`text-base mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          💼 {c.open_positions} open positions
                        </p>
                      )}
                      <div className="text-red-600 font-semibold text-lg flex items-center gap-2">
                        View Details
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* View More / View Less */}
            {hiringCompanies.length > 3 && (
              <div className="text-center pt-6">
                <button
                  onClick={() => setShowAllCompanies(!showAllCompanies)}
                  className={`px-8 py-3 rounded-lg font-semibold text-lg transition-colors ${
                    isDark 
                      ? 'bg-[#2c2c2c] hover:bg-gray-700 text-gray-200' 
                      : 'bg-[#F0E6D2] hover:bg-gray-200 text-gray-800'
                  }`}
                >
                  {showAllCompanies ? 'View Less' : 'View More'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

{/* Right Column - Archetype Analysis */}
<div className="space-y-6 w-full w-full sm:px-4 md:px-6 lg:px-8"> 
  <div
    className={`rounded-lg border p-6 transition-all ${
      isDark ? 'bg-[#2c2c2c] border-gray-700' : 'bg-white border-[#DACAO2]'
    }`}
  >

    {archetypeLoading ? (
      <div className="space-y-4 p-6">
        <div
          className={`h-24 rounded-lg animate-pulse ${
            isDark ? 'bg-gray-800' : 'bg-gray-200'
          }`}
        ></div>
      </div>
    ) : userArchetype ? (
      <div className="space-y-6 p-6 flex flex-col"> 
        {/* Primary Archetype */}
        <div className="text-center">
          {/* Gradient Box */}
          <div
            className={`rounded-xl p-6 shadow-inner transition-all ${
              isDark
                ? 'bg-[#464646] text-gray-100'
                : 'bg-[#E7E2D8] text-gray-900'
            }`}
          >
            <div
              className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-4 ${
                isDark
                  ? 'bg-orange-900 text-orange-300'
                  : 'bg-orange-100 text-orange-800'
              }`}
            >
              PRIMARY ARCHETYPE
            </div>

            <div
              className={`text-4xl font-bold mb-1 ${
                isDark ? 'text-green-400' : 'text-green-600'
              }`}
            >
              {userArchetype.primary}
            </div>

            <p
              className={`text-sm font-medium mb-1 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Calculated Primary Archetype
            </p>

            <div
              className={`text-2xl font-semibold ${
                isDark ? 'text-green-400' : 'text-green-600'
              }`}
            >
              {
                Object.entries({
                  'Applied Practitioner':
                    userArchetype.archetype_realistic_percentage || 0,
                  'Analytical Thinker':
                    userArchetype.archetype_investigative_percentage || 0,
                  'Creative Innovator':
                    userArchetype.archetype_artistic_percentage || 0,
                  'Collaborative Supporter':
                    userArchetype.archetype_social_percentage || 0,
                  'Strategic Leader':
                    userArchetype.archetype_enterprising_percentage || 0,
                  'Methodical Organizer':
                    userArchetype.archetype_conventional_percentage || 0,
                }).find(([name]) => name === userArchetype.primary)?.[1]
              }
              %
            </div>
          </div>
        </div>

        {/* Methodology note */}
        <p className={`text-xs -mt-2 mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Percentages reflect fairness-normalized values when available (adjusted for curriculum axis prevalence).
        </p>

        {/* All Archetypes Toggle */}
        <div className="flex flex-col items-center w-full">
          <button
            onClick={() => setShowAllArchetypes(!showAllArchetypes)}
            className={`flex justify-center items-center gap-2 px-6 py-3 rounded-md font-semibold text-left transition-colors ${
              isDark
                ? 'bg-[#2c2c2c] text-gray-300 hover:bg-gray-700'
                : 'bg-[#F0E6D2] text-gray-800 hover:bg-gray-200'
            }`}
            style={{ width: '250px' }}
          >
            <span>All Archetypes</span>
            <svg
              className={`w-4 h-4 transform transition-transform ${
                showAllArchetypes ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showAllArchetypes && (
            <div className="mt-5 w-full space-y-4 transition-all duration-300">
              {Object.entries({
                'Applied Practitioner':
                  userArchetype.archetype_realistic_percentage || 0,
                'Analytical Thinker':
                  userArchetype.archetype_investigative_percentage || 0,
                'Creative Innovator':
                  userArchetype.archetype_artistic_percentage || 0,
                'Collaborative Supporter':
                  userArchetype.archetype_social_percentage || 0,
                'Strategic Leader':
                  userArchetype.archetype_enterprising_percentage || 0,
                'Methodical Organizer':
                  userArchetype.archetype_conventional_percentage || 0,
              })
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([archetype, percentage]) => {
                  const getArchetypeColor = (archetypeName: string) => {
                    switch (archetypeName) {
                      case 'Applied Practitioner':
                        return isDark ? 'text-green-400' : 'text-green-600';
                      case 'Analytical Thinker':
                        return isDark ? 'text-pink-400' : 'text-pink-600';
                      case 'Creative Innovator':
                        return isDark ? 'text-blue-400' : 'text-blue-600';
                      case 'Collaborative Supporter':
                        return isDark ? 'text-cyan-400' : 'text-cyan-600';
                      case 'Strategic Leader':
                        return isDark ? 'text-purple-400' : 'text-purple-600';
                      case 'Methodical Organizer':
                        return isDark ? 'text-orange-400' : 'text-orange-600';
                      default:
                        return isDark ? 'text-gray-400' : 'text-gray-500';
                    }
                  };

                  const getBarColor = (archetypeName: string) => {
                    switch (archetypeName) {
                      case 'Applied Practitioner':
                        return isDark ? 'bg-green-400' : 'bg-green-500';
                      case 'Analytical Thinker':
                        return isDark ? 'bg-pink-400' : 'bg-pink-500';
                      case 'Creative Innovator':
                        return isDark ? 'bg-blue-400' : 'bg-blue-500';
                      case 'Collaborative Supporter':
                        return isDark ? 'bg-cyan-400' : 'bg-cyan-500';
                      case 'Strategic Leader':
                        return isDark ? 'bg-purple-400' : 'bg-purple-500';
                      case 'Methodical Organizer':
                        return isDark ? 'bg-orange-400' : 'bg-orange-500';
                      default:
                        return isDark ? 'bg-gray-400' : 'bg-gray-500';
                    }
                  };

                  return (
                    <div key={archetype} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span
                          className={`text-lg font-medium ${
                            isDark ? 'text-gray-200' : 'text-gray-800'
                          }`}
                        >
                          {archetype}
                        </span>
                        <span
                          className={`text-lg font-semibold ${getArchetypeColor(
                            archetype
                          )}`}
                        >
                          {percentage}%
                        </span>
                      </div>
                      <div
                        className={`h-3 rounded-full overflow-hidden ${
                          isDark ? 'bg-gray-700' : 'bg-gray-200'
                        }`}
                      >
                        <div
                          className={`h-full transition-all duration-500 ${getBarColor(
                            archetype
                          )}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    ) : (
      <div
        className={`text-center py-8 ${
          isDark ? 'text-gray-400' : 'text-gray-600'
        }`}
      >
        <p>Upload your transcript to see your archetype analysis</p>
      </div>
    )}

            </div>
            </div>
          </div>
        </div>
        )}

        {/* Analysis Section */}
        {activeSection === 'analysis' && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-6 flex items-center space-x-4">
              <button 
                onClick={() => setActiveSection('feed')}
                className="text-blue-400 hover:text-blue-300 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back to Feed</span>
              </button>
            </div>
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-8">
              <h2 className="text-2xl font-bold mb-6">Academic Analysis</h2>
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">No Analysis Available</h3>
                <p className="text-gray-400 mb-6">Upload your transcript to see your learning archetype and academic insights.</p>
                <div className="bg-gray-800 rounded-lg p-6 mb-6">
                  <h4 className="text-lg font-semibold mb-4">Upload Your Documents</h4>
                  <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-gray-600 transition-colors cursor-pointer">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-gray-300 mb-2">Click to upload or drag and drop</p>
                    <p className="text-gray-400 text-sm">PDF, DOC, or DOCX (max. 10MB)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dossier Section */}
        {activeSection === 'dossier' && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-6 flex items-center space-x-4">
              <button 
                onClick={() => setActiveSection('feed')}
                className="text-blue-400 hover:text-blue-300 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back to Feed</span>
              </button>
            </div>
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">My Professional Dossier</h2>
                <div className="flex space-x-3">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
                    Generate PDF
                  </button>
                  <button className="border border-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:border-gray-500 transition-colors">
                    Share Link
                  </button>
                </div>
              </div>

              {/* Dossier Preview */}
              <div className="bg-white text-black rounded-lg p-8 mb-6">
                {/* Header */}
                <div className="border-b-2 border-gray-200 pb-6 mb-6">
                  <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
                  <p className="text-lg text-gray-600">{user.course}</p>
                  <p className="text-gray-600">{user.email}</p>
                </div>

                {/* Academic Profile */}
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Academic Profile</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2">Learning Archetype</h3>
                      <p className="text-gray-600">Analysis pending - upload transcript to discover</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2">Academic Standing</h3>
                      <p className="text-gray-600">GPA analysis pending</p>
                    </div>
                  </div>
                </div>

                {/* Core Competencies */}
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Core Competencies</h2>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-600">Competencies will be identified based on your academic performance analysis</p>
                  </div>
                </div>

                {/* Career Recommendations */}
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Recommended Career Paths</h2>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-600">Career recommendations will appear after completing your archetype analysis</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t-2 border-gray-200 pt-4 text-center">
                  <p className="text-sm text-gray-500">Generated by Gradalyze • Professional Academic Portfolio</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Section */}
        {activeSection === 'settings' && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-6 flex items-center space-x-4">
              <button 
                onClick={() => setActiveSection('feed')}
                className="text-blue-400 hover:text-blue-300 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back to Feed</span>
              </button>
            </div>
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-8">
              <h2 className="text-2xl font-bold mb-6">Settings</h2>
              <div className="space-y-6">
                {/* Profile Settings */}
                <div className="border-b border-gray-700 pb-6">
                  <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                      <input 
                        type="text" 
                        value={user.name}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                      <input 
                        type="email" 
                        value={user.email}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Course</label>
                      <input 
                        type="text" 
                        value={user.course}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Year Level</label>
                      <input 
                        type="text" 
                        value="N/A"
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white"
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                {/* Account Actions */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Account Actions</h3>
                  <div className="space-y-3">
                    <button className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors">
                      📥 Download My Data
                    </button>
                    <button className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors">
                      Reset Recommendations
                    </button>
                    <button className="w-full text-left px-4 py-3 bg-red-900 hover:bg-red-800 text-red-300 rounded-md transition-colors" onClick={() => setShowDeleteModal(true)}>
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={()=>!deleting && setShowDeleteModal(false)} />
          <div className="relative bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-xl font-bold text-white mb-2">Delete account?</h3>
            <p className="text-gray-300 text-sm mb-4">This action is permanent. Your profile, grades, certificates, and saved analysis will be removed. You will be signed out.</p>
            {deleteError && <p className="text-red-400 text-sm mb-3">{deleteError}</p>}
            <div className="flex justify-end gap-3">
              <button className="px-4 py-2 rounded bg-gray-800 hover:bg-gray-700" disabled={deleting} onClick={()=>setShowDeleteModal(false)}>Cancel</button>
              <button className={`px-4 py-2 rounded ${deleting ? 'bg-red-800' : 'bg-red-700 hover:bg-red-600'} text-white`} onClick={performDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;