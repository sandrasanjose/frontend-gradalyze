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
  twoColumn?: boolean;
}

const AnalysisResults = ({
  careerForecast,
  primaryArchetype,
  archetypePercents,
  twoColumn,
}: AnalysisResultsProps) => {
  const { isDark } = useTheme();
  // Bar palette for career forecast (cycled)
  const barColors = ['#3b82f6','#22c55e','#a78bfa','#f59e0b','#ef4444','#14b8a6'];
  const containerClass = twoColumn ? 'grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-3 items-stretch' : '';
  const blockSpacing = twoColumn ? '' : ' mt-6';
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

  // Colors for archetype donut segments
  const archetypeColors: Record<string, string> = {
    realistic: '#22c55e',
    investigative: '#60a5fa',
    artistic: '#a78bfa',
    social: '#f59e0b',
    enterprising: '#ef4444',
    conventional: '#14b8a6',
  };

  // (conic-gradient helper removed; using SVG wedges)

  const archetypeLegend = () => {
    const entries = Object.entries(archetypePercents || {})
      .filter(([, v]) => typeof v === 'number' && (v as number) > 0) as [string, number][];
    if (entries.length === 0) return (
      <p className={isDark ? 'text-gray-400 text-sm' : 'text-gray-600 text-sm'}>No archetype data yet.</p>
    );

    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {entries.sort((a,b)=>b[1]-a[1]).map(([k,v]) => {
          const info = (archetypeInfo as any)[k];
          const label = info?.title || k;
          return (
          <div key={k} className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: archetypeColors[k] || '#94a3b8' }} />
            <span className={isDark ? 'text-gray-200 text-sm' : 'text-gray-800 text-sm'}>{label}</span>
            <span className={isDark ? 'text-gray-400 text-xs' : 'text-gray-600 text-xs'}>{(v as number).toFixed(1)}%</span>
          </div>
          );
        })}
      </div>
    );
  };

  const careerCallout = () => {
    let topLabel = '';
    let topPct = 0;
    if (Array.isArray(careerForecast)) {
      if (careerForecast.length > 0) {
        topLabel = String(careerForecast[0]).replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
        topPct = 100; // heuristic for ordered arrays
      }
    } else if (careerForecast && typeof careerForecast === 'object') {
      const entries = Object.entries(careerForecast as Record<string, number>);
      if (entries.length > 0) {
        const [k,v] = entries.reduce((a,b)=> (b[1] > a[1] ? b : a));
        topLabel = k.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
        topPct = Math.round((Number(v)||0)*100);
      }
    }
    const tint = isDark ? 'bg-red-900/20 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700';
    const subTint = isDark ? 'text-gray-400' : 'text-gray-600';
    if (!topLabel) return null;
    return (
      <div className={`rounded-xl border ${tint} p-4 mb-0`}>
        <div className="flex items-center gap-2 mb-1">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1"/>
            <rect x="3" y="6" width="18" height="14" rx="2" ry="2"/>
          </svg>
          <span className="text-sm font-medium">Recommended Career Path</span>
        </div>
        <div className={isDark ? 'text-white font-semibold' : 'text-gray-900 font-semibold'}>{topLabel}</div>
        <div className={`text-xs mt-1 ${subTint}`}>{topPct}% archetype alignment • based on profile-to-role matching</div>
      </div>
    );
  };

  const careerBars = () => (
    Array.isArray(careerForecast) ? (
      (careerForecast.length === 0) ? (
        <p className={isDark ? 'text-gray-400 text-sm' : 'text-gray-600 text-sm'}>No forecast yet.</p>
      ) : (
        <div className="space-y-3">
          {careerForecast.slice(0, 6).map((job, idx) => {
            const pct = Math.min(100, 100 - idx * 10);
            const bar = barColors[idx % barColors.length];
            return (
              <div key={String(job)}>
                <div className="flex items-center justify-between mb-1">
                  <span className={isDark ? 'text-gray-300 text-sm' : 'text-gray-700 text-sm'}>{String(job).replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</span>
                  <span className={isDark ? 'text-white text-xs' : 'text-gray-900 text-xs'}>{pct}%</span>
                </div>
                <div className={isDark ? 'w-full h-2 rounded bg-gray-700' : 'w-full h-2 rounded bg-gray-300'}>
                  <div className="h-2 rounded" style={{ width: `${pct}%`, backgroundColor: bar }} />
                </div>
              </div>
            );
          })}
        </div>
      )
    ) : (
      (Object.keys(careerForecast || {}).length === 0) ? (
        <p className={isDark ? 'text-gray-400 text-sm' : 'text-gray-600 text-sm'}>No forecast yet.</p>
      ) : (
        <div className="space-y-3">
          {Object.entries(careerForecast || {}).map(([k, v], idx) => {
            const pct = Math.round((Number(v) || 0) * 100);
            const label = k.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
            const bar = barColors[idx % barColors.length];
            return (
              <div key={k}>
                <div className="flex items-center justify-between mb-1">
                  <span className={isDark ? 'text-gray-300 text-sm' : 'text-gray-700 text-sm'}>{label}</span>
                  <span className={isDark ? 'text-white text-xs' : 'text-gray-900 text-xs'}>{pct}%</span>
                </div>
                <div className={isDark ? 'w-full h-2 rounded bg-gray-700' : 'w-full h-2 rounded bg-gray-300'}>
                  <div className="h-2 rounded" style={{ width: `${Math.min(100, Math.max(0, pct))}%`, backgroundColor: bar }} />
                </div>
              </div>
            );
          })}
        </div>
      )
    )
  );

  // Primary archetype display data for center text
  const primaryKey = (primaryArchetype || '').toLowerCase();
  const entriesForPrimary = Object.entries(archetypePercents || {}).filter(([, v]) => typeof v === 'number') as [string, number][];
  const maxEntry = entriesForPrimary.length > 0 ? entriesForPrimary.reduce((a,b)=> (b[1] > a[1] ? b : a)) : undefined;
  const chosenKey = primaryKey && (archetypePercents as any)?.[primaryKey] != null ? primaryKey : (maxEntry ? maxEntry[0] : '');
  const chosenPct = chosenKey ? (archetypePercents as any)?.[chosenKey] as number : 0;
  const chosenTitle = chosenKey && (archetypeInfo as any)[chosenKey]?.title ? (archetypeInfo as any)[chosenKey].title : (primaryArchetype || '');
  const chosenColor = archetypeColors[chosenKey] || (isDark ? '#e5e7eb' : '#111827');

  if (twoColumn) {
    return (
      <div className={containerClass}>
        {/* Archetype (Donut) */}
        <div>
          <div className="mb-2">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Archetype Distribution</h3>
          </div>
          <div className={`px-6 pt-4 pb-2 rounded-lg border${blockSpacing} ${isDark ? 'bg-gradient-to-br from-gray-800/50 to-gray-700/50 border-gray-600/50' : 'bg-gradient-to-br from-gray-100/50 to-gray-200/50 border-gray-300/50'} h-full max-h-[500px] flex flex-col`}>
          <div className="flex flex-col items-center gap-4">
            <div className="relative mx-auto" style={{ width: 260, height: 260 }}>
              {
                (() => {
                  const entries = Object.entries(archetypePercents || {})
                    .filter(([, v]) => typeof v === 'number' && (v as number) > 0) as [string, number][];
                  const total = entries.reduce((s, [, v]) => s + (v as number), 0) || 1;
                  let currentAngle = -90; // start at top
                  const gap = 1.5; // deg gap between wedges
                  const cx = 130, cy = 130, r = 90, stroke = 40;
                  const toRad = (deg: number) => (deg * Math.PI) / 180;
                  const arcPath = (startDeg: number, endDeg: number) => {
                    const sA = toRad(startDeg);
                    const eA = toRad(endDeg);
                    const x1 = cx + r * Math.cos(sA);
                    const y1 = cy + r * Math.sin(sA);
                    const x2 = cx + r * Math.cos(eA);
                    const y2 = cy + r * Math.sin(eA);
                    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
                    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
                  };
                  return (
                    <svg width={260} height={260}>
                      {entries.map(([k, v]) => {
                        const slice = (v / total) * 360;
                        const start = currentAngle + gap / 2;
                        const end = currentAngle + slice - gap / 2;
                        currentAngle += slice;
                        if (end <= start) return null;
                        return (
                          <path key={k}
                            d={arcPath(start, end)}
                            stroke={archetypeColors[k] || '#94a3b8'}
                            strokeWidth={stroke}
                            fill="none"
                            strokeLinecap="butt"
                          />
                        );
                      })}
                      {/* Inner circle */}
                      <circle cx={cx} cy={cy} r={r - stroke/2 + 2} fill={isDark ? '#1f2937' : '#ffffff'} />
                      {/* Center text */}
                      <text x={cx} y={cy - 6} textAnchor="middle" className="font-extrabold" fill={isDark ? '#ffffff' : '#111827'} style={{fontSize:'28px'}}>{(Number(chosenPct)||0).toFixed(1)}%</text>
                      <text x={cx} y={cy + 16} textAnchor="middle" fill={chosenColor} style={{fontSize:'12px', fontWeight:600}}>{chosenTitle || 'Primary Profile'}</text>
                      <text x={cx} y={cy + 32} textAnchor="middle" fill={isDark ? '#d1d5db' : '#6b7280'} style={{fontSize:'9px', letterSpacing:'0.08em'}}>
                        PRIMARY PROFILE
                      </text>
                    </svg>
                  );
                })()
              }
            </div>
            <div className={`h-px ${isDark ? 'bg-gray-700' : 'bg-gray-300'} w-11/12 max-w-[360px] my-2 rounded-full`} />
            <div className="w-full">
              {archetypeLegend()}
            </div>
          </div>
          </div>
        </div>

        {/* Career (Bars) */}
        <div>
          <div className="mb-2">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Career Trajectory Forecast</h3>
          </div>
          <div className={`px-6 pt-4 pb-2 rounded-lg border${blockSpacing} ${isDark ? 'bg-gradient-to-br from-gray-800/50 to-gray-700/50 border-gray-600/50' : 'bg-gradient-to-br from-gray-100/50 to-gray-200/50 border-gray-300/50'} max-h-[500px] flex flex-col`}>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs mb-6`}>
            Match percentage indicates alignment between your archetype profile and historical hiring patterns for each role.
          </p>
          {careerBars()}
          <div className="mt-8 mb-16">{careerCallout()}</div>
          </div>
        </div>
      </div>
    );
  }

  // Default (stacked) original rendering
  return (
    <div className={containerClass}>
      {/* Career Forecast (stacked) */}
      <div className={`p-6 rounded-lg border${blockSpacing} ${
        isDark 
          ? 'bg-gradient-to-br from-gray-800/50 to-gray-700/50 border-gray-600/50' 
          : 'bg-gradient-to-br from-gray-100/50 to-gray-200/50 border-gray-300/50'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Career Forecast</h3>
        </div>
        {careerBars()}
      </div>

      {/* Archetype Summary (stacked) */}
      <div className={`p-6 rounded-lg border${blockSpacing} ${
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
                      <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{(v as number).toFixed(1)}%</span>
                    </div>
                    <div className={`w-full h-2 rounded mt-2 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}>
                      <div 
                        className="bg-blue-600 h-2 rounded" 
                        style={{ width: `${Math.min(100, Math.max(0, v as number))}%` }} 
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
    </div>
  );
};

export default AnalysisResults;