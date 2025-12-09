import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getApiUrl } from '../config/api';
import { gradesService } from '../services/gradesService';
import TranscriptUpload from '../analyiscomponents/TranscriptUpload';
import AnalysisResults from '../analyiscomponents/AnalysisResults';
import ProcessButton from '../analyiscomponents/ProcessButton';
import UniversalGradesTable from '../analyiscomponents/UniversalGradesTable';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeToggle } from '../components/ThemeToggle';

type ExistingTranscript = {
  hasFile: boolean;
  fileName?: string;
  url?: string;
  _temp?: boolean;
  storagePath?: string;
};

export type GradeRow = {
  id: string;
  subject: string;
  courseCode?: string;
  units: number;
  grade: number;
  semester: string;
};

type User = {
  id: number;
  name: string;
  email: string;
  course: string;
  student_number: string;
};

const AnalysisPage = () => {
  const { isDark } = useTheme();

  console.log('AnalysisPage theme:', { isDark });

  const [user, setUser] = useState<User>({ id: 0, name: '', email: '', course: '', student_number: '' });
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [existingTranscript, setExistingTranscript] = useState<ExistingTranscript | null>(null);

  // Editable grades table state
  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showGrades, setShowGrades] = useState(false);

  // Track created blob URLs to revoke later
  const [blobUrls, setBlobUrls] = useState<string[]>([]);
  const [tempTranscriptSizeKB, setTempTranscriptSizeKB] = useState<number | null>(null);

  // Archetype summary state
  const [primaryArchetype, setPrimaryArchetype] = useState<string>('');
  const [archetypePercents, setArchetypePercents] = useState<{
    realistic?: number; investigative?: number; artistic?: number; social?: number; enterprising?: number; conventional?: number;
  }>({});
  const [careerForecast, setCareerForecast] = useState<Record<string, number> | string[]>({});
  const [contributingSubjects, setContributingSubjects] = useState<Record<string, string[]>>({});
  const [populationCounts, setPopulationCounts] = useState<Record<string, number>>({});

  const normalizeToRows = (raw: unknown[]): GradeRow[] => {
    if (!Array.isArray(raw)) return [];
    return raw
      .map((g, idx) => {
        const gradeObj = g as {
          subject?: unknown;
          courseCode?: unknown;
          code?: unknown;
          name?: unknown;
          units?: unknown;
          grade?: unknown;
          semester?: unknown;
          id?: unknown;
        };

        const subject = String(gradeObj.subject || gradeObj.name || 'Unknown Subject');
        const units = Number(gradeObj.units) || 0;
        const grade = parseFloat((Number(gradeObj.grade) || 0).toFixed(2));
        const semester = String(gradeObj.semester || 'Detected Subjects');
        const courseCode = String(gradeObj.courseCode || gradeObj.code || '');
        const id = String(gradeObj.id || `${Date.now()}_${idx}`);
        return { id, subject, courseCode, units, grade, semester } as GradeRow;
      })
      .filter(r => r.subject && r.subject !== 'Unknown Subject');
  };

  const formatAllGrades = () => {
    setGrades(prev => prev.map(grade => ({
      ...grade,
      grade: parseFloat(grade.grade.toFixed(2))
    })));
  };

  const fetchProfile = useCallback(async (email: string) => {
    try {
      const res = await fetch(`${getApiUrl('PROFILE_BY_EMAIL')}?email=${encodeURIComponent(email)}`);
      if (!res.ok) throw new Error('Failed to load profile');
      const data = await res.json();

      // Transcript - only show if we have both URL and storage path
      const hasValidTorUrl = !!(typeof data.tor_url === 'string' && data.tor_url.trim() !== '');
      const hasValidTorPath = !!(typeof data.tor_storage_path === 'string' && data.tor_storage_path.trim() !== '');
      const hasTor = hasValidTorUrl && hasValidTorPath;

      if (hasTor) {
        const url: string = data.tor_url.trim();
        setExistingTranscript({
          hasFile: true,
          fileName: data.tor_storage_path.split('/').pop() || 'transcript.pdf',
          url,
          storagePath: data.tor_storage_path,
        });
      } else {
        setExistingTranscript({ hasFile: false });
      }

      // Preload grades from tor_notes if provided
      if (data.tor_notes) {
        try {
          const parsed = JSON.parse(data.tor_notes);
          if (Array.isArray(parsed?.grades)) {
            setGrades(normalizeToRows(parsed.grades));
            setTimeout(() => formatAllGrades(), 100);
          }
          const cf = parsed?.analysis_results?.career_forecast;
          if (cf && typeof cf === 'object') setCareerForecast(cf);

          const arch = parsed?.analysis_results?.archetype_analysis;
          if (arch) {
            const norm = arch?.debias_percentages || arch?.opportunity_normalized_percentages || arch?.normalized_percentages || arch?.archetype_percentages;
            if (norm && typeof norm === 'object') {
              const toNum = (v: unknown): number => {
                const n = Number(v); return Number.isFinite(n) ? n : 0;
              };

              setArchetypePercents({
                realistic: toNum((norm as any).Realistic ?? (norm as any).realistic),
                investigative: toNum((norm as any).Investigative ?? (norm as any).investigative),
                artistic: toNum((norm as any).Artistic ?? (norm as any).artistic),
                social: toNum((norm as any).Social ?? (norm as any).social),
                enterprising: toNum((norm as any).Enterprising ?? (norm as any).enterprising),
                conventional: toNum((norm as any).Conventional ?? (norm as any).conventional),
              });
              if (typeof arch?.primary_archetype_debiased === 'string') {
                setPrimaryArchetype(arch.primary_archetype_debiased);
              } else if (typeof arch?.primary_archetype === 'string') {
                setPrimaryArchetype(arch.primary_archetype);
              }

              if (arch.contributing_subjects) {
                setContributingSubjects(arch.contributing_subjects);
              }
            }
          }
        } catch (error) {
          console.error('Error:', error);
        }
      }

      // Merge profile fields into user state (ensure numeric id is set)
      // FIX: Use data.user_id if available, as backend returns user_id
      setUser((prev) => ({
        id: typeof data?.user_id === 'number' ? data.user_id : (typeof data?.id === 'number' ? data.id : prev.id),
        name: String(data?.name || prev.name || ''),
        email: String(data?.email || prev.email || ''),
        course: String(data?.course || prev.course || ''),
        student_number: String(data?.student_number || prev.student_number || ''),
      }));

      // Capture archetype percentages
      setPrimaryArchetype(String(data.primary_archetype || ''));
      setArchetypePercents(prev => {
        const already = Object.values(prev || {}).some(v => typeof v === 'number');
        if (already) return prev;
        return {
          realistic: data.archetype_realistic_percentage != null && !Number.isNaN(Number(data.archetype_realistic_percentage)) ? Number(data.archetype_realistic_percentage) : undefined,
          investigative: data.archetype_investigative_percentage != null && !Number.isNaN(Number(data.archetype_investigative_percentage)) ? Number(data.archetype_investigative_percentage) : undefined,
          artistic: data.archetype_artistic_percentage != null && !Number.isNaN(Number(data.archetype_artistic_percentage)) ? Number(data.archetype_artistic_percentage) : undefined,
          social: data.archetype_social_percentage != null && !Number.isNaN(Number(data.archetype_social_percentage)) ? Number(data.archetype_social_percentage) : undefined,
          enterprising: data.archetype_enterprising_percentage != null && !Number.isNaN(Number(data.archetype_enterprising_percentage)) ? Number(data.archetype_enterprising_percentage) : undefined,
          conventional: data.archetype_conventional_percentage != null && !Number.isNaN(Number(data.archetype_conventional_percentage)) ? Number(data.archetype_conventional_percentage) : undefined,
        };
      });

      let setForecast = false;
      if (Array.isArray(data.career_top_jobs)) {
        if (Array.isArray(data.career_top_jobs_scores) && data.career_top_jobs_scores.length === data.career_top_jobs.length) {
          const map: Record<string, number> = {};
          data.career_top_jobs.forEach((label: string, i: number) => {
            map[label] = data.career_top_jobs_scores[i];
          });
          setCareerForecast(map);
          setForecast = true;
        } else {
          setCareerForecast(data.career_top_jobs);
          setForecast = true;
        }
      }

      if (!setForecast && typeof data?.email === 'string' && data.email) {
        try {
          const latest = await fetch(`${getApiUrl('OBJECTIVE_1_LATEST')}?email=${encodeURIComponent(data.email)}`);
          if (latest.ok) {
            const latestJson = await latest.json();
            if (Array.isArray(latestJson.career_top_jobs)) {
              if (Array.isArray(latestJson.career_top_jobs_scores) && latestJson.career_top_jobs_scores.length === latestJson.career_top_jobs.length) {
                const map: Record<string, number> = {};
                latestJson.career_top_jobs.forEach((label: string, i: number) => { map[label] = latestJson.career_top_jobs_scores[i]; });
                setCareerForecast(map);
              } else {
                setCareerForecast(latestJson.career_top_jobs);
              }
            }
          }
        } catch (error) {
          console.error('Error:', error);
        }
      }
    } catch (e) {
      console.error(e);
      setExistingTranscript({ hasFile: false });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(() => ({
          id: typeof parsed?.id === 'number' ? parsed.id : 0,
          name: String(parsed?.name || ''),
          email: String(parsed?.email || ''),
          course: String(parsed?.course || ''),
          student_number: String(parsed?.student_number || ''),
        }));
        if (parsed?.email) fetchProfile(parsed.email);
      } catch (error) {
        console.error('Error:', error);
      }
    } else {
      setIsLoading(false);
    }
    return () => {
      blobUrls.forEach(u => URL.revokeObjectURL(u));
    };
  }, [blobUrls, fetchProfile]);

  // Debounced auto-save whenever grades change
  useEffect(() => {
    console.log('[AnalysisPage] Auto-save effect triggered. User:', user, 'Grades count:', grades?.length);
    if (!user?.id) {
      console.warn('[AnalysisPage] Auto-save skipped: No user ID');
      return;
    }
    if (!grades || grades.length === 0) return;
    const handle = setTimeout(async () => {
      try {
        console.log('[AnalysisPage] Saving grades for user:', user.id);
        await gradesService.updateUserGrades(user.id, grades);
      } catch (e) {
        console.warn('Auto-save grades failed (non-blocking):', e);
      }
    }, 800);
    return () => clearTimeout(handle);
  }, [grades, user?.id]);

  const fetchSavedGrades = async (uid: number) => {
    try {
      if (!uid) return;
      const saved = await gradesService.getUserGrades(uid);
      if (Array.isArray(saved) && saved.length > 0) {
        setGrades(saved);
      }
    } catch (e) {
      console.warn('Failed to fetch saved grades', e);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchSavedGrades(user.id);
    }
  }, [user?.id]);

  // Dynamic Universal OCR Handler
  const handleGradesExtracted = (extractedGrades: unknown[]) => {
    console.log('[OCR] Handling grades for Universal Table:', extractedGrades);

    if (Array.isArray(extractedGrades) && extractedGrades.length > 0) {
      console.log('[OCR] First item keys:', Object.keys(extractedGrades[0] as object));
      const processedGrades: GradeRow[] = extractedGrades.map((g: any, index) => {
        if (typeof g === 'number') {
          return {
            id: `grade-${Date.now()}-${index}`,
            subject: `Subject ${index + 1}`,
            courseCode: '',
            units: 3.0,
            grade: parseFloat(g.toFixed(2)),
            semester: 'Detected Subjects'
          };
        }

        const rawGrade = g.grade;
        let numGrade = parseFloat(rawGrade);
        const strGrade = String(rawGrade).toLowerCase();
        if (isNaN(numGrade) || ['inc', 'drp', 'w', 'na'].some(s => strGrade.includes(s))) {
          numGrade = 0.00;
        }

        return {
          id: g.id || `grade-${Date.now()}-${index}`,
          subject: g.subject || g.course_title || g.course_name || `Subject ${index + 1}`,
          courseCode: g.courseCode || g.code || g.course_no || '',
          units: parseFloat(g.units) || 3.0,
          grade: parseFloat(numGrade.toFixed(2)),
          semester: g.semester || 'Detected Subjects'
        };
      });

      setGrades(processedGrades);
      setShowGrades(true);
      console.log('[OCR] Universal table populated with', processedGrades.length, 'subjects');
    } else {
      alert('No grades were found in the document. Please try a clearer PDF.');
    }
  };

  const handleBlobUrlAdd = (url: string) => {
    setBlobUrls(prev => [...prev, url]);
  };

  const resetGradesTable = async () => {
    if (isProcessing) return;
    try {
      setGrades([]);
      if (user.id) {
        await gradesService.updateUserGrades(user.id, []);
      }
    } catch (e) {
      console.warn('Failed to reset grades table', e);
    }
  };

  const validateAndProcess = async () => {
    try {
      setIsProcessing(true);

      if (grades.length === 0) {
        alert('Please add at least one grade before processing analysis.');
        return;
      }

      const invalidGrades = grades.filter(grade =>
        !grade.subject ||
        grade.subject.trim() === '' ||
        grade.grade < 0 ||
        grade.grade > 5.0
      );

      if (invalidGrades.length > 0) {
        alert(`Please fix invalid data for: ${invalidGrades.map(g => g.subject).join(', ')}`);
        return;
      }

      const gradeValuesArray = grades.map(g => g.grade);

      try {
        if ((user as any)?.id && grades.length > 0) {
          await gradesService.updateUserGrades(user.id, grades);
        }
      } catch (e) {
        console.warn('Failed to persist grades (non-blocking):', e);
      }

      const isCS = ((user.course || '').toLowerCase().includes('computer science'));
      const obj1Endpoint = isCS ? 'OBJECTIVE_1_PROCESS_CS' : 'OBJECTIVE_1_PROCESS';

      const obj1Resp = await fetch(getApiUrl(obj1Endpoint as any), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, grades: gradeValuesArray })
      });

      if (!obj1Resp.ok) {
        const e = await obj1Resp.json().catch(() => ({}));
        throw new Error(e.message || 'Failed to process career forecasting');
      }

      const obj1Result = await obj1Resp.json();

      if (Array.isArray(obj1Result.career_top_jobs)) {
        if (Array.isArray(obj1Result.career_top_jobs_scores) && obj1Result.career_top_jobs_scores.length === obj1Result.career_top_jobs.length) {
          const map: Record<string, number> = {};
          obj1Result.career_top_jobs.forEach((label: string, i: number) => {
            map[label] = obj1Result.career_top_jobs_scores[i];
          });
          setCareerForecast(map);
        } else {
          setCareerForecast(obj1Result.career_top_jobs);
        }
      } else if (obj1Result.career_forecast) {
        setCareerForecast(obj1Result.career_forecast);
      }

      const obj2Resp = await fetch(getApiUrl('OBJECTIVE_2_PROCESS'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          grades: grades, // Send full grade objects for subject analysis
          order_ids: [],
          gamma: 0.9,
          r: 0.7,
          tau: 0.8,
          similarity: 'cosine'
        })
      });
      if (!obj2Resp.ok) {
        const e = await obj2Resp.json().catch(() => ({}));
        throw new Error(e.message || 'Failed to process archetype analysis');
      }

      const obj2Result = await obj2Resp.json();

      if (obj2Result.archetype_analysis) {
        const archetypeData = obj2Result.archetype_analysis;
        if (archetypeData.primary_archetype_debiased) {
          setPrimaryArchetype(archetypeData.primary_archetype_debiased);
        } else if (archetypeData.primary_archetype) {
          setPrimaryArchetype(archetypeData.primary_archetype);
        }
        const p = (archetypeData.debias_percentages
          || archetypeData.opportunity_normalized_percentages
          || archetypeData.normalized_percentages
          || archetypeData.archetype_percentages) as Record<string, unknown> | undefined;
        if (p) {
          const toNum = (v: unknown): number => {
            const n = Number(v);
            return Number.isFinite(n) ? n : 0;
          };
          setArchetypePercents({
            realistic: toNum((p as any).realistic ?? (p as any).Realistic),
            investigative: toNum((p as any).investigative ?? (p as any).Investigative),
            artistic: toNum((p as any).artistic ?? (p as any).Artistic),
            social: toNum((p as any).social ?? (p as any).Social),
            enterprising: toNum((p as any).enterprising ?? (p as any).Enterprising),
            conventional: toNum((p as any).conventional ?? (p as any).Conventional),
          });
        }

        if (archetypeData.contributing_subjects) {
          setContributingSubjects(archetypeData.contributing_subjects);
        }
      }

      if (obj2Result.population_counts) {
        setPopulationCounts(obj2Result.population_counts);
      }

    } catch (e: unknown) {
      console.error('Processing error:', e);
      alert(e instanceof Error ? e.message : 'Failed to process analysis');
    } finally {
      setIsProcessing(false);
    }
  };

  const clearAnalysisResults = async () => {
    try {
      if (!user.email) { alert('Missing user email'); return; }

      const isCS = ((user.course || '').toLowerCase().includes('computer science'));
      const obj1ClearEndpoint = isCS ? 'OBJECTIVE_1_CLEAR_CS' : 'OBJECTIVE_1_CLEAR';
      const clearPromises = [
        fetch(getApiUrl(obj1ClearEndpoint as any), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email })
        }),
        fetch(getApiUrl('OBJECTIVE_2_CLEAR'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email })
        }),
        fetch(getApiUrl('OBJECTIVE_3_CLEAR'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email })
        })
      ];

      const results = await Promise.all(clearPromises);
      const errors = results.filter(res => !res.ok);

      if (errors.length > 0) {
        throw new Error('Failed to clear some analysis results');
      }

      setCareerForecast({});
      setPrimaryArchetype('');
      setArchetypePercents({});
      setContributingSubjects({});
      setPopulationCounts({});
      await fetchProfile(user.email);
      alert('Analysis results removed');
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to clear results';
      alert(errorMessage);
    }
  };

  return (
    <div className={`analysis-page-container ${isDark ? 'dark' : 'light'}`}>
      <nav className={`analysis-nav ${isDark ? 'dark' : 'light'}`}>
        <div className="w-full px-6 sm:px-8 lg:px-10 xl:px-12">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img
                src="/logo.png"
                alt="Gradalyze Logo"
                className="h-10 w-auto"
              />
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center justify-center scale-100 md:scale-105">
                <ThemeToggle />
              </div>

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

                {showProfileDropdown && (
                  <div className={`profile-dropdown-menu ${isDark ? 'dark' : 'light'}`}>
                    <div className="py-2">
                      <div className={`px-5 py-3 border-b ${isDark ? 'border-gray-700' : 'border-[#DACAO2]'}`}>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{user.name}</p>
                        <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>{user.email}</p>
                      </div>
                      <Link
                        to="/dashboard"
                        className={`block w-full text-left px-5 py-2.5 text-sm font-medium transition-colors ${isDark ? 'text-gray-300 hover:bg-[#364153]' : 'text-gray-700 hover:bg-[#F0E6D2]'
                          }`}
                        onClick={() => setShowProfileDropdown(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        to="/analysis"
                        className={`block w-full text-left px-5 py-2.5 text-sm font-medium transition-colors ${isDark ? 'text-gray-300 hover:bg-[#364153]' : 'text-gray-700 hover:bg-[#F0E6D2]'
                          }`}
                        onClick={() => setShowProfileDropdown(false)}
                      >
                        Analysis Results
                      </Link>
                      <Link
                        to="/dossier"
                        className={`block w-full text-left px-5 py-2.5 text-sm font-medium transition-colors ${isDark ? 'text-gray-300 hover:bg-[#364153]' : 'text-gray-700 hover:bg-[#F0E6D2]'
                          }`}
                        onClick={() => setShowProfileDropdown(false)}
                      >
                        My Dossier
                      </Link>
                      <Link
                        to="/settings"
                        className={`block w-full text-left px-5 py-2.5 text-sm font-medium transition-colors ${isDark ? 'text-gray-300 hover:bg-[#364153]' : 'text-gray-700 hover:bg-[#F0E6D2]'
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
                          className={`block w-full text-left px-5 py-2.5 text-sm font-medium transition-colors ${isDark ? 'text-red-400 hover:bg-[#364153]' : 'text-red-600 hover:bg-[#F0E6D2]'
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`analysis-card ${isDark ? 'dark' : 'light'}`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded-sm"></div>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Academic Analysis</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearAnalysisResults}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 border border-red-500 text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                disabled={isProcessing}
                title="Remove saved career forecast and archetype data"
              >
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M6 2a1 1 0 00-1 1v1H3.5a.5.5 0 000 1H4v10a2 2 0 002 2h8a2 2 0 002-2V5h.5a.5.5 0 000-1H15V3a1 1 0 00-1-1H6zm1 2V3h7v1H7zm1 3a.75.75 0 011.5 0v7a.75.75 0 01-1.5 0V7zm4 0a.75.75 0 011.5 0v7a.75.75 0 01-1.5 0V7z" /></svg>
                Remove Analysis
              </button>
              <ProcessButton
                isProcessing={isProcessing}
                gradesLength={grades.length}
                onProcess={validateAndProcess}
              />
            </div>
          </div>

          {isLoading ? (
            <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading…</div>
          ) : (
            <div className="space-y-8">
              <TranscriptUpload
                existingTranscript={existingTranscript}
                onTranscriptChange={setExistingTranscript}
                onGradesExtracted={handleGradesExtracted}
                user={user}
                blobUrls={blobUrls}
                onBlobUrlAdd={handleBlobUrlAdd}
                tempTranscriptSizeKB={tempTranscriptSizeKB}
                onTempSizeChange={setTempTranscriptSizeKB}
              />

              <div className="mt-2 flex items-center justify-between gap-3">
                <button
                  onClick={() => setShowGrades(!showGrades)}
                  disabled={isProcessing}
                  className={`px-3 py-2 rounded-md text-sm ${isProcessing ? (isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-400 text-gray-600') : (isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800')}`}
                >
                  {showGrades ? 'Hide Program Table' : 'Show Program Table'}
                </button>
                <button
                  onClick={resetGradesTable}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 border border-red-500 text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                  title="Reset grades table"
                >
                  Reset Table
                </button>
                {/* 
                <button
                  onClick={handleManualSave}
                  disabled={isProcessing || grades.length === 0}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 border border-green-500 text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  title="Save grades to database"
                >
                  Save Grades
                </button>
                */}
              </div>

              {showGrades && (
                <UniversalGradesTable
                  grades={grades}
                  onGradesChange={setGrades}
                  isProcessing={isProcessing}
                />
              )}

              <AnalysisResults
                careerForecast={careerForecast}
                primaryArchetype={primaryArchetype}
                archetypePercents={archetypePercents}
                contributingSubjects={contributingSubjects}
                populationCounts={populationCounts}
                existingTranscript={existingTranscript}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AnalysisPage;