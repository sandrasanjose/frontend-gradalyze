import { useTheme } from '../contexts/ThemeContext';

interface AnalysisResultsProps {
  careerForecast: Record<string, number> | string[];
  primaryArchetype: string;
  archetypePercents: {
    realistic?: number;
    investigative?: number;
    artistic?: number;
    social?: number;
    enterprising?: number;
    conventional?: number;
  };
  existingTranscript: { hasFile: boolean } | null;
}

const AnalysisResults = ({
  careerForecast,
  primaryArchetype,
  archetypePercents,

}: AnalysisResultsProps) => {
  const { isDark } = useTheme();
  const archetypeInfo: Record<string, { title: string; indicators: string; roles: string }> = {
    realistic: {
      title: 'Applied Practitioner',
      indicators: 'Strong performance in hardware/networking, systems installation, and applied labs',
      roles: 'Hardware technician, network engineer, systems administrator'
    },
    investigative: {
      title: 'Analytical Thinker',
      indicators: 'High achievement in math, algorithms, data structures, ML/AI, and research projects',
      roles: 'Data scientist, AI/ML engineer, systems analyst, researcher'
    },
    artistic: {
      title: 'Creative Innovator',
      indicators: 'Excellence in UI/UX, multimedia apps, creative coding, and human-computer interaction',
      roles: 'UI/UX designer, game developer, digital media specialist, software engineer'
    },
    social: {
      title: 'Collaborative Supporter',
      indicators: 'Strong performance in communication-intensive subjects, teamwork-driven projects, and IT support',
      roles: 'IT support specialist, systems trainer, academic tutor, community IT facilitator'
    },
    enterprising: {
      title: 'Strategic Leader',
      indicators: 'Success in project management, entrepreneurship subjects, and leadership tasks',
      roles: 'IT project manager, tech entrepreneur, product manager, team lead'
    },
    conventional: {
      title: 'Methodical Organizer',
      indicators: 'High performance in database management, information systems, documentation, and structured coding',
      roles: 'Database administrator, systems auditor, QA tester, technical writer'
    }
  };

  return (
    <>
      {/* Career Forecast */}
      <div className={`p-6 rounded-lg border mt-6 ${
        isDark 
          ? 'bg-gradient-to-br from-gray-800/50 to-gray-700/50 border-gray-600/50' 
          : 'bg-gradient-to-br from-gray-100/50 to-gray-200/50 border-gray-300/50'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Career Forecast</h3>
        </div>
        {Array.isArray(careerForecast) ? (
          careerForecast.length === 0 ? (
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>No forecast yet. Click "Process & Analyze" to compute your top jobs.</p>
          ) : (
            <div className="space-y-3">
              {careerForecast.slice(0, 6).map((job, idx) => (
                <div key={String(job)} className={`p-3 rounded-lg border ${
                  isDark 
                    ? 'bg-[#2c2c2c] border-gray-600 hover:border-gray-500' 
                    : 'bg-white border-[#DACAO2] hover:border-gray-400'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{String(job).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                  </div>
                  <div className={`w-full h-2 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}>
                    <div className="bg-blue-600 h-2 rounded" style={{ width: `${Math.min(100, 100 - idx * 10)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
        Object.keys(careerForecast || {}).length === 0 ? (
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            No forecast yet. Click "Process & Analyze" after providing grades to compute your career success scores.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.keys(careerForecast || {}).map((k) => {
              const v = (careerForecast as Record<string, number>)[k] ?? 0;
              const pct = Math.round((Number(v) || 0) * 100);
              const label = k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
              return (
                <div key={k} className={`p-3 rounded-lg border ${
                  isDark 
                    ? 'bg-[#2c2c2c] border-gray-600 hover:border-gray-500' 
                    : 'bg-white border-[#DACAO2] hover:border-gray-400'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{label}</span>
                    <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{pct}%</span>
                  </div>
                  <div className={`w-full h-2 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}>
                    <div 
                      className="bg-blue-600 h-2 rounded" 
                      style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Archetype Summary */}
      <div className={`p-6 rounded-lg border mt-6 ${
        isDark 
          ? 'bg-gradient-to-br from-gray-800/50 to-gray-700/50 border-gray-600/50' 
          : 'bg-gradient-to-br from-gray-100/50 to-gray-200/50 border-gray-300/50'
          
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Archetype Summary</h3>
        </div>
        {(primaryArchetype || Object.values(archetypePercents || {}).some(v => typeof v === 'number')) ? (
          <>
            {primaryArchetype && (
              <p className={`text-sm mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Primary Archetype: <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{primaryArchetype}</span>
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(archetypePercents || {}).map(([k, v]) => {
                if (typeof v !== 'number') return null;
                const info = archetypeInfo[k as keyof typeof archetypeInfo];
                return (
                  <div key={k} className={`p-4 rounded-lg border ${
                    isDark 
                      ? 'bg-[#2c2c2c] border-gray-600 hover:border-gray-500' 
                      : 'bg-white border-[#DACAO2] hover:border-gray-400'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`text-sm capitalize ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{k}</div>
                        {info && <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{info.title}</div>}
                      </div>
                      <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{v.toFixed(1)}%</span>
                    </div>
                    <div className={`w-full h-2 rounded mt-2 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}>
                      <div 
                        className="bg-blue-600 h-2 rounded" 
                        style={{ width: `${Math.min(100, Math.max(0, v))}%` }} 
                      />
                    </div>
                    {info && (
                      <div className={`mt-3 text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        <div className="mb-1">
                          <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Academic Indicators:</span> {info.indicators}
                        </div>
                        <div>
                          <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Possible Roles:</span> {info.roles}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            No archetype data yet. Click "Analyze" after providing grades to compute your RIASEC archetype.
          </p>
        )}
      </div>
    </>
  );
};

export default AnalysisResults;