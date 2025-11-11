import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getApiUrl } from '../config/api';
import { gradesService } from '../services/gradesService';
import TranscriptUpload from '../analyiscomponents/TranscriptUpload';
import AnalysisResults from '../analyiscomponents/AnalysisResults';
import ProcessButton from '../analyiscomponents/ProcessButton';
import ITStaticTable from '../analyiscomponents/ITStaticTable';
import CStaticTable from '../analyiscomponents/CStaticTable';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeToggle } from '../components/ThemeToggle';

type ExistingTranscript = {
  hasFile: boolean;
  fileName?: string;
  url?: string;
  _temp?: boolean;
  storagePath?: string;
};

// type ExistingCertificate = { // Commented out - unused
//   id: number;
//   path?: string;
//   name: string;
//   url: string;
//   _temp?: boolean;
// };

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
  
  // Debug theme state
  console.log('AnalysisPage theme:', { isDark });
  
  const [user, setUser] = useState<User>({ id: 0, name: '', email: '', course: '', student_number: '' });
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [existingTranscript, setExistingTranscript] = useState<ExistingTranscript | null>(null);
  // const [existingCertificates] = useState<ExistingCertificate[]>([]); // Commented out - unused
  // const [, setCertificateAnalyses] = useState<unknown[]>([]); // Commented out - unused

  // Editable grades table state
  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showGrades, setShowGrades] = useState(false);
  const [itOrderIds, setItOrderIds] = useState<string[] | null>(null);
  const [savedGradesCache, setSavedGradesCache] = useState<GradeRow[] | null>(null);
  const [tableResetKey, setTableResetKey] = useState<number>(0);

  // Track created blob URLs to revoke later
  const [blobUrls, setBlobUrls] = useState<string[]>([]);
  const [tempTranscriptSizeKB, setTempTranscriptSizeKB] = useState<number | null>(null);

  // Archetype summary state
  const [primaryArchetype, setPrimaryArchetype] = useState<string>('');
  const [archetypePercents, setArchetypePercents] = useState<{
    realistic?: number; investigative?: number; artistic?: number; social?: number; enterprising?: number; conventional?: number;
  }>({});
  const [careerForecast, setCareerForecast] = useState<Record<string, number> | string[]>({});
  const [prefillById, setPrefillById] = useState<Record<string, number> | null>(null);

  const fetchProfile = useCallback(async (email: string) => {
    try {
      const res = await fetch(`${getApiUrl('PROFILE_BY_EMAIL')}?email=${encodeURIComponent(email)}`);
      if (!res.ok) throw new Error('Failed to load profile');
      const data = await res.json();

      // Transcript - only show if we have both URL and storage path (more strict check)
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
            // Ensure all grades are properly formatted
            setTimeout(() => formatAllGrades(), 100);
          }
          const cf = parsed?.analysis_results?.career_forecast;
          if (cf && typeof cf === 'object') setCareerForecast(cf);
          // Prefer backend normalized archetype percentages if available
          const arch = parsed?.analysis_results?.archetype_analysis;
          const norm = arch?.debias_percentages || arch?.opportunity_normalized_percentages || arch?.normalized_percentages || arch?.archetype_percentages;
          if (norm && typeof norm === 'object') {
            const toNum = (v: unknown): number => {
              const n = Number(v); return Number.isFinite(n) ? n : 0;
            };

  // Debounced auto-save whenever grades change
  useEffect(() => {
    if (!user?.id) return;
    if (!grades) return;
    const handle = setTimeout(async () => {
      try {
        await gradesService.updateUserGrades(user.id, grades);
      } catch (e) {
        console.warn('Auto-save grades failed (non-blocking):', e);
      }
    }, 800);
    return () => clearTimeout(handle);
  }, [grades, user?.id]);
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
          }
        } catch (error) {
        console.error('Error:', error);
      }
      }

      // Certificates - accept paths and/or urls; also accept string/CSV
      const toArray = (v: unknown): string[] => {
        if (!v) return [];
        if (Array.isArray(v)) return v.filter(Boolean);
        if (typeof v === 'string') {
          try {
            // try json string first
            const parsed = JSON.parse(v);
            if (Array.isArray(parsed)) return parsed.filter(Boolean);
          } catch (error) {
        console.error('Error:', error);
      }
          // fallback: comma-separated
          return v.split(',').map((s) => s.trim()).filter(Boolean);
        }
        return [];
      };

      const bucket = (import.meta.env.VITE_CERT_BUCKET as string) || 'certificates';

      const paths = toArray(data.certificate_paths);
      const urls = toArray(data.certificate_urls);

      type CertItem = { id: number; path?: string; url: string; name: string; _temp?: boolean };
      const items: CertItem[] = [];

      // helper to extract a normalized storage path from a public URL
      const extractPathFromUrl = (u: string): string | undefined => {
        try {
          const marker = `/${bucket}/`;
          const idx = u.indexOf(marker);
          if (idx !== -1) {
            return u.substring(idx + marker.length);
          }
          // fallback: try last two segments
          const urlObj = new URL(u);
          const parts = urlObj.pathname.split('/').filter(Boolean);
          if (parts.length >= 2) {
            return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
          }
        } catch (error) {
        console.error('Error:', error);
      }
        return undefined;
      };

      const seenKeys = new Set<string>();
      const pushIfNew = (item: CertItem) => {
        const key = item.path || extractPathFromUrl(item.url) || item.url;
        if (!key || seenKeys.has(key)) return;
        seenKeys.add(key);
        items.push({ ...item, id: items.length });
      };

      // from paths
      paths.forEach((p) => {
        if (!p || p.startsWith('temp/')) return;
        const name = p.split('/').pop() || 'Certificate';
        // url is optional for our UI; keep empty to avoid mismatched dedupe keys
        pushIfNew({ id: 0, path: p, url: '', name });
      });

      // from urls
      urls.forEach((u) => {
        if (!u) return;
        const name = u.split('/').pop() || 'Certificate';
        pushIfNew({ id: 0, url: u, name });
      });

      // latest fields
      if (typeof data.latest_certificate_path === 'string' && data.latest_certificate_path.trim() !== '') {
        const p = data.latest_certificate_path as string;
        if (!paths.includes(p)) {
          const name = p.split('/').pop() || 'Certificate';
          pushIfNew({ id: 0, path: p, url: '', name });
        }
      }
      if (typeof data.latest_certificate_url === 'string' && data.latest_certificate_url.trim() !== '') {
        const u = data.latest_certificate_url as string;
        if (!urls.includes(u)) {
          const name = u.split('/').pop() || 'Certificate';
          pushIfNew({ id: 0, url: u, name });
        }
      }

      // const deduped = items.map((it, idx) => ({ ...it, id: idx })); // Commented out - unused variable

      // setExistingCertificates(deduped); // Commented out - unused variable

      // Merge profile fields into user state (ensure numeric id is set)
      setUser((prev) => ({
        id: typeof data?.id === 'number' ? data.id : prev.id,
        name: String(data?.name || prev.name || ''),
        email: String(data?.email || prev.email || ''),
        course: String(data?.course || prev.course || ''),
        student_number: String(data?.student_number || prev.student_number || ''),
      }));

      // Capture archetype percentages for summary (fallback to denormalized columns if tor_notes didn't set it)
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
      // Capture career top jobs array if present; if scores exist, build map for percentages
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

      // Fallback: fetch latest Objective 1 if profile does not include forecast
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
      // Clear UI to reflect unknown/empty state rather than showing stale items
      setExistingTranscript({ hasFile: false });
      // setExistingCertificates([]); // Commented out - unused variable
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

  const normalizeToRows = (raw: unknown[]): GradeRow[] => {
    if (!Array.isArray(raw)) return [];
    return raw
      .map((g, idx) => {
        const gradeObj = g as { 
          subject?: unknown; 
          course?: unknown; 
          code?: unknown; 
          name?: unknown; 
          units?: unknown; 
          credit_units?: unknown; 
          credits?: unknown; 
          grade?: unknown; 
          final_grade?: unknown; 
          rating?: unknown; 
          semester?: unknown; 
          term?: unknown; 
          period?: unknown; 
        };
        
        const subject = String(gradeObj.subject || gradeObj.course || gradeObj.code || gradeObj.name || 'Unknown Subject');
        const units = Number(gradeObj.units ?? gradeObj.credit_units ?? gradeObj.credits ?? 0) || 0;
        const grade = parseFloat((Number(gradeObj.grade ?? gradeObj.final_grade ?? gradeObj.rating ?? 0) || 0).toFixed(2));
        const semester = String(gradeObj.semester ?? gradeObj.term ?? gradeObj.period ?? 'N/A');
        return { id: `${Date.now()}_${idx}`, subject, units, grade, semester } as GradeRow;
      })
      .filter(r => r.subject && r.subject !== 'Unknown Subject');
  };

  const extractGradeValuesInOrder = (grades: GradeRow[], course: string): number[] => {
    // Prefer runtime-emitted order from table if available (ensures exact length/indexing)
    const runtimeOrder = itOrderIds && itOrderIds.length > 0 ? itOrderIds : null;
    const curriculumOrder = runtimeOrder || getCurriculumOrder(course);
    
    // Create a map of existing grades by unique ID
    const gradesMap = new Map<string, number>();
    grades.forEach(grade => {
      if (grade.id && grade.grade !== undefined) {
        gradesMap.set(grade.id, grade.grade);
      }
    });
    
    // Build fixed-length array with grade values in curriculum order
    const gradeValues: number[] = [];
    
    curriculumOrder.forEach(uniqueId => {
      const grade = gradesMap.get(uniqueId);
      gradeValues.push(grade !== undefined ? grade : 0); // Use 0 for missing grades
    });
    
    return gradeValues;
  };

  const getCurriculumOrder = (course: string): string[] => {
  const courseLower = (course || '').toLowerCase();

  // --- BS INFORMATION TECHNOLOGY ---
  if (courseLower.includes('information technology')) {
    return [
      // --- BSIT Year 1 / First Semester ---
      'it_fy1_sts0002', 'it_fy1_aap0007', 'it_fy1_pcm0006', 'it_fy1_mmw0001', 'it_fy1_ipp0010', 
      'it_fy1_icc0101', 'it_fy1_icc0101_1', 'it_fy1_icc0102', 'it_fy1_icc0102_1', 'it_fy1_ped0001', 
      'it_fy1_nstp01',

      // --- BSIT Year 1 / Second Semester ---
      'it_fy2_cet0111', 'it_fy2_cet0114', 'it_fy2_cet0114_1', 'it_fy2_eit0121', 'it_fy2_eit0121_1a',
      'it_fy2_eit0122', 'it_fy2_eit0123', 'it_fy2_eit0123_1', 'it_fy2_icc0103', 'it_fy2_icc0103_1',
      'it_fy2_gtb121', 'it_fy2_ped0013', 'it_fy2_nstp02',


      // --- BSIT Year 2 / First Semester ---
      'it_sy1_cet0121', 'it_sy1_cet0225', 'it_sy1_cet0225_1', 'it_sy1_tcw0005', 'it_sy1_icc0104', 
      'it_sy1_icc0104_1', 'it_sy1_eit0211', 'it_sy1_eit0211_1a', 'it_sy1_ppc122', 'it_sy1_eit_elective1', 
      'it_sy1_ped0054',

      // --- BSIT Year 2 / Second Semester ---
      'it_sy2_eit0212', 'it_sy2_eit0221', 'it_sy2_eit0222', 'it_sy2_eit0222_1', 'it_sy2_ges0013',
      'it_sy2_rph0004', 'it_sy2_uts0003', 'it_sy2_eit_elective2', 'it_sy2_ped0074',

      // --- BSIT Year 3 / First Semester ---
      'it_ty1_icc0335', 'it_ty1_icc0335_1', 'it_ty1_eit0311', 'it_ty1_eit0311_1', 'it_ty1_eit_elective3',
      'it_ty1_eit0312', 'it_ty1_eit0312_1', 'it_ty1_lwr0009',
      
      // --- BSIT Year 3 / Second Semester ---
      'it_ty2_eit0321', 'it_ty2_eit0321_1', 'it_ty2_eit0322', 'it_ty2_eit0322_1', 'it_ty2_eit0323',
      'it_ty2_eit0323_1', 'it_ty2_eth0008',
      
      // --- BSIT Year 3 / Midyear/Summer Term ---
      'it_my_cap0101', 'it_my_eit0331', 'it_my_eit0331_1',

      // --- BSIT Year 4 / First Semester ---
      'it_fy4_cap0102', 'it_fy4_eit_elective4', 'it_fy4_eit_elective5', 'it_fy4_eit_elective6',

      // --- BSIT Year 4 / Second Semester ---
      'it_fy4b_iip0101a', 'it_fy4b_iip0101_1',
    ];
  }

  // --- BS COMPUTER SCIENCE ---
  if (courseLower.includes('computer science')) {
    return [
      // --- BSCS Year 1 / First Semester ---
      'cs_fy1_csc0102', 'cs_fy1_icc0101', 'cs_fy1_icc0101_1', 'cs_fy1_icc0102', 'cs_fy1_icc0102_1',
      'cs_fy1_ipp0010', 'cs_fy1_mmw0001', 'cs_fy1_ped0001', 'cs_fy1_pcm0006', 'cs_fy1_sts0002', 'cs_fy1_nstp01',

      // --- BSCS Year 1 / Second Semester ---
      'cs_fy2_csc0211', 'cs_fy2_csc0223', 'cs_fy2_icc0103', 'cs_fy2_icc0103_1', 'cs_fy2_icc0104',
      'cs_fy2_icc0104_1', 'cs_fy2_lwr0009', 'cs_fy2_ped0012', 'cs_fy2_rph0004', 'cs_fy2_tcw0005', 'cs_fy2_nstp02',

      // --- BSCS Year 2 / First Semester ---
      'cs_sy1_csc0212', 'cs_sy1_csc0212_1', 'cs_sy1_csc0213', 'cs_sy1_csc0213_1', 'cs_sy1_csc0224',
      'cs_sy1_eth0008', 'cs_sy1_icc0105', 'cs_sy1_icc0105_1', 'cs_sy1_ite0001', 'cs_sy1_ped0074', 'cs_sy1_uts0003',

      // --- BSCS Year 2 / Second Semester ---
      'cs_sy2_cbm0016', 'cs_sy2_csc0221', 'cs_sy2_csc0222', 'cs_sy2_csc0222_1', 'cs_sy2_csc0316',
      'cs_sy2_ges0013', 'cs_sy2_icc0106', 'cs_sy2_icc0106_1', 'cs_sy2_ped0023', 'cs_sy2_aap0007',

      // --- BSCS Year 3 / First Semester ---
      'cs_ty1_csc0311', 'cs_ty1_csc0312', 'cs_ty1_csc0312_1',
      'cs_ty1_csc0313', 'cs_ty1_csc0313_1', 'cs_ty1_csc0314', 'cs_ty1_csc0314_1',
      'cs_ty1_csc0315', 'cs_ty1_csc0315_1',

      // --- BSCS Year 3 / Second Semester ---
      'cs_ty2_csc0321', 'cs_ty2_csc0321_1', 'cs_ty2_csc0322', 'cs_ty2_csc0322_1',
      'cs_ty2_csc0323', 'cs_ty2_csc0323_1', 'cs_ty2_csc0324', 'cs_ty2_csc0324_1', 'cs_ty2_csc0325',

      // --- BSCS Year 3 / Midyear/Summer Term ---
      'cs_ty_csc195_1',

      // --- BSCS Year 4 / First Semester ---
      'cs_fy4_csc0411', 'cs_fy4_csc0412', 'cs_fy4_csc0412_1',
      'cs_fy4_csc0413', 'cs_fy4_csc0413_1', 'cs_fy4_csc0414', 'cs_fy4_csc0414_1',

      // --- BSCS Year 4 / Second Semester ---
      'cs_fy4b_csc0421a', 'cs_fy4b_csc0422', 'cs_fy4b_csc0422_1',
      'cs_fy4b_csc0423', 'cs_fy4b_csc0424', 'cs_fy4b_csc0424_1',
    ];
  }

  // --- Default ---
  return [];
};



  // Function to ensure all grades are properly formatted with two decimal places
  const formatAllGrades = () => {
    setGrades(prev => prev.map(grade => ({
      ...grade,
      grade: parseFloat(grade.grade.toFixed(2))
    })));
  };

  // Fetch saved grades from backend and render to table
  const fetchSavedGrades = async (uid: number) => {
    try {
      if (!uid) return;
      const saved = await gradesService.getUserGrades(uid);
      if (Array.isArray(saved) && saved.length > 0) {
        setSavedGradesCache(saved);
        // Do not auto-open the table; keep it hidden until the user clicks
      }
    } catch (e) {
      console.warn('Failed to fetch saved grades', e);
    }
  };

  // When user is known, load saved grades
  useEffect(() => {
    if (user?.id) {
      fetchSavedGrades(user.id);
    }
  }, [user?.id]);

  // When table order is known and we have cached grades, remap them to canonical IDs and prefill
  useEffect(() => {
    if (!savedGradesCache || savedGradesCache.length === 0) return;
    const order = (itOrderIds && itOrderIds.length > 0) ? itOrderIds : getCurriculumOrder(user.course);
    if (!order || order.length === 0) return;
    // Only hydrate if table is empty to avoid clobbering user edits
    if (grades && grades.length > 0) return;
    const map = new Map(savedGradesCache.map(g => [g.id, g] as const));
    const remapped: GradeRow[] = order.map((id, idx) => {
      const g = map.get(id);
      if (g) return { ...g, grade: parseFloat(Number(g.grade).toFixed(2)) } as GradeRow;
      return { id, subject: `Subject ${idx + 1}`, courseCode: '', units: 3, grade: 0, semester: '' } as GradeRow;
    });
    setGrades(remapped);
    setPrefill(remapped.map(r => parseFloat(Number(r.grade || 0).toFixed(2))));
    const idMap: Record<string, number> = {};
    remapped.forEach(r => { if (r?.id) idMap[r.id] = parseFloat(Number(r.grade || 0).toFixed(2)); });
    setPrefillById(idMap);
    // clear cache marker so we don't reapply
    setSavedGradesCache(null);
  }, [savedGradesCache, itOrderIds]);

  // Ensure current grades align to the runtime-emitted order to keep table and arrays in sync
  useEffect(() => {
    if (!itOrderIds || itOrderIds.length === 0) return;
    if (!grades || grades.length === 0) return;
    // If current grades already match order and length, skip
    const sameLen = grades.length === itOrderIds.length;
    const sameOrder = sameLen && grades.every((g, i) => g.id === itOrderIds[i]);
    if (sameLen && sameOrder) return;
    const map = new Map(grades.map(g => [g.id, g] as const));
    const remapped: GradeRow[] = itOrderIds.map((id, idx) => {
      const existing = map.get(id);
      if (existing) return existing;
      return {
        id,
        subject: `Subject ${idx + 1}`,
        courseCode: '',
        units: 3,
        grade: 0,
        semester: ''
      } as GradeRow;
    });
    setGrades(remapped);
    setPrefill(remapped.map(r => parseFloat(Number(r.grade || 0).toFixed(2))));
    const idMap2: Record<string, number> = {};
    remapped.forEach(r => { if (r?.id && typeof r.grade === 'number') idMap2[r.id] = parseFloat(Number(r.grade).toFixed(2)); });
    setPrefillById(idMap2);
  }, [itOrderIds]);

  const [prefill, setPrefill] = useState<number[]>([]);
  const handleGradesExtracted = (extractedGrades: unknown[], metadata?: any[]) => {
    console.log('[OCR] handling grades for prefill:', extractedGrades, metadata);
    
    if (Array.isArray(extractedGrades) && extractedGrades.length > 0) {
      // Resolve canonical order: prefer runtime-emitted order from table (ensures exact expected length)
      const order = (itOrderIds && itOrderIds.length > 0) ? itOrderIds : getCurriculumOrder(user.course);
      const expectedLen = order.length;

      // Check if it's structured grade objects (new format)
      const firstGrade = extractedGrades[0];
      if (firstGrade && typeof firstGrade === 'object' && 'grade' in firstGrade) {
        console.log('[OCR] Structured grades detected, mapping to curriculum order');
        const curriculumOrder = order;

        // Map extracted grades to curriculum IDs in order, padding to full length
        const gradeRows: GradeRow[] = Array.from({ length: expectedLen }).map((_, index) => {
          const g = extractedGrades[index] as any;
          const gradeObj = g as {
            id?: unknown;
            subject?: unknown;
            courseCode?: unknown;
            units?: unknown;
            grade: unknown;
            semester?: unknown;
          };

          // Use curriculum ID if available, otherwise fallback to generic
          const curriculumId = curriculumOrder[index] || `G-${index + 1}`;

          // Normalize grade (INC/DRP/W/NA => 0.00; clamp [0,5])
          const raw = gradeObj?.grade as any;
          const rawStr = String(raw ?? '').trim().toLowerCase();
          let gnum = parseFloat(String(raw));
          if (!isFinite(gnum) || rawStr === 'inc' || rawStr === 'incomplete' || rawStr === 'drp' || rawStr === 'drop' || rawStr === 'w' || rawStr === 'na' || rawStr === 'n/a') {
            gnum = 0.0;
          }
          gnum = Math.min(5.0, Math.max(0.0, gnum));

          return {
            id: curriculumId,
            subject: g && typeof gradeObj?.subject === 'string' ? gradeObj.subject : `Subject ${index + 1}`,
            courseCode: g && typeof gradeObj?.courseCode === 'string' ? gradeObj.courseCode : '',
            units: g && typeof gradeObj?.units === 'number' ? (gradeObj.units as number) : 3,
            grade: parseFloat(Number(gnum).toFixed(2)),
            semester: g && typeof gradeObj?.semester === 'string' ? gradeObj.semester : ''
          };
        });

        // Set prefill array with grade values (pad to expected length)
        const numericGradesPadded: number[] = Array.from({ length: expectedLen }).map((_, i) => {
          const gg = extractedGrades[i] as any;
          const vRaw = gg && (typeof gg.grade === 'string' || typeof gg.grade === 'number') ? gg.grade : '';
          const vStr = String(vRaw).trim().toLowerCase();
          let v = parseFloat(String(vRaw));
          if (!isFinite(v) || vStr === 'inc' || vStr === 'incomplete' || vStr === 'drp' || vStr === 'drop' || vStr === 'w' || vStr === 'na' || vStr === 'n/a') {
            v = 0.0;
          }
          v = Math.min(5.0, Math.max(0.0, v));
          return parseFloat(Number(v).toFixed(2));
        });
        setPrefill(numericGradesPadded);
        // when we have gradeRows with ids, also build map
        const idMap3: Record<string, number> = {};
        gradeRows.forEach(r => { if (r?.id && typeof r.grade === 'number') idMap3[r.id] = parseFloat(Number(r.grade).toFixed(2)); });
        setPrefillById(idMap3);

        // Populate the grades table with mapped curriculum data
        setGrades(gradeRows);
        console.log('[OCR] Populated grades table with', gradeRows.length, 'courses mapped to curriculum');
      }
      // Check if it's numeric array (current backend format)
      else if (extractedGrades.every(g => typeof g === 'number')) {
        console.log('[OCR] Numeric grades detected, mapping to curriculum order');
        const curriculumOrder = order;
        const numericGrades = extractedGrades as number[];

        // Create grade rows using backend metadata if available
        const gradeRows: GradeRow[] = Array.from({ length: expectedLen }).map((_, index) => {
          const curriculumId = curriculumOrder[index] || `G-${index + 1}`;
          let gradeValue = index < numericGrades.length ? numericGrades[index] : 0;
          
          // Find metadata for this course
          const courseMeta = metadata?.find(m => m.id === curriculumId);
          
          return {
            id: curriculumId,
            subject: courseMeta?.title || `Subject ${index + 1}`,
            units: courseMeta?.units || 3,
            grade: parseFloat(Number(gradeValue).toFixed(2)),
            semester: ''
          };
        });
        
        // Set prefill array for dropdown initialization (pad to expected length)
        const prefillArr: number[] = Array.from({ length: expectedLen }).map((_, i) => {
          let v = i < numericGrades.length ? numericGrades[i] : 0;
          if (!isFinite(v as number)) v = 0.0;
          v = Math.min(5.0, Math.max(0.0, Number(v)));
          return parseFloat(Number(v).toFixed(2));
        });
        setPrefill(prefillArr);
        const idMap4: Record<string, number> = {};
        gradeRows.forEach(r => { if (r?.id && typeof r.grade === 'number') idMap4[r.id] = parseFloat(Number(r.grade).toFixed(2)); });
        setPrefillById(idMap4);

        // Populate the grades table with mapped curriculum data
        setGrades(gradeRows);
        console.log('[OCR] Populated grades table with', gradeRows.length, 'courses mapped to curriculum');
      }
    }
    setShowGrades(true);
  };

  // Removed parseOcrText function - just focus on console logging

  const handleBlobUrlAdd = (url: string) => {
    setBlobUrls(prev => [...prev, url]);
  };

  const resetGradesTable = async () => {
    if (isProcessing) return;
    try {
      setGrades([]);
      setPrefill([]);
      setPrefillById(null);
      setSavedGradesCache(null);
      setTableResetKey((k) => k + 1); // force remount of the static table to clear internal select state
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
      
      // Validate that we have grades to process
      if (grades.length === 0) {
        alert('Please add at least one grade before processing analysis.');
        return;
      }

      // Validate grades data
      const invalidGrades = grades.filter(grade => 
        !grade.subject || 
        grade.subject.trim() === '' || 
        grade.units <= 0 || 
        grade.grade < 0 || 
        grade.grade > 5.0
      );

      if (invalidGrades.length > 0) {
        alert(`Please fix the following issues:\n${invalidGrades.map(g => `- ${g.subject}: Invalid data`).join('\n')}`);
        return;
      }

      // OCR should have been done during transcript upload
      // If no grades are present, user needs to re-upload transcript
      if (grades.length === 0) {
        alert('No grades found. Please upload your transcript again to extract grades.');
        return;
      }

      // Persist grades array immediately before analysis
      try {
        if (user.id && grades.length > 0) {
          await gradesService.updateUserGrades(user.id, grades);
        }
      } catch (e) {
        // Non-blocking: proceed with analysis even if persistence fails
        console.warn('Failed to save grades before analysis', e);
      }

      // Extract just the grade values in curriculum order (aligned to runtime order)
      const gradeValuesArray = extractGradeValuesInOrder(grades, user.course);

      // Log the grades array being sent to backend and check order alignment
      console.log('=== GRADES ARRAY BEING SENT TO BACKEND ===');
      console.log('Original grades from table:', grades.length);
      console.log('Grade values array length:', gradeValuesArray.length);
      console.log('Grade values array:', gradeValuesArray);
      if (itOrderIds && itOrderIds.length) {
        console.log('Runtime emitted order length:', itOrderIds.length);
        console.log('First 10 order IDs:', itOrderIds.slice(0, 10));
        console.log('First 10 grade rows [id, grade]:', grades.slice(0, 10).map(g => [g.id, g.grade]));
        const misalignedIdx: number[] = [];
        const maxCheck = Math.min(grades.length, itOrderIds.length);
        for (let i = 0; i < maxCheck; i++) {
          if (grades[i]?.id !== itOrderIds[i]) misalignedIdx.push(i);
        }
        if (misalignedIdx.length) {
          console.warn('Misaligned indices between grades[] and itOrderIds:', misalignedIdx.slice(0, 20));
        }
      }
      console.log('=== END GRADES ARRAY ===');

      // Persist current grades to backend (users.grades) before analysis
      try {
        // ensure we have a numeric user id and some grades to save
        if ((user as any)?.id && grades.length > 0) {
          await fetch(`${getApiUrl('UPDATE_GRADES')}/${(user as any).id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ grades })
          });
        }
      } catch (e) {
        console.warn('Failed to persist grades (non-blocking):', e);
      }

      // Objective 1 endpoint selection (CS vs IT)
      const isCS = ((user.course || '').toLowerCase().includes('computer science'));
      const obj1Endpoint = isCS ? 'OBJECTIVE_1_PROCESS_CS' : 'OBJECTIVE_1_PROCESS';

      const obj1Resp = await fetch(getApiUrl(obj1Endpoint as 'OBJECTIVE_1_PROCESS' | 'OBJECTIVE_1_PROCESS_CS'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, grades: gradeValuesArray })
      });
      
      if (!obj1Resp.ok) {
        const e = await obj1Resp.json().catch(() => ({}));
        throw new Error(e.message || 'Failed to process career forecasting');
      }
      
      const obj1Result = await obj1Resp.json();
      console.log('Objective 1 (Career Forecasting) result:', obj1Result);
      
      // Update career forecast state with results (supports array or map)
      if (Array.isArray(obj1Result.career_top_jobs)) {
        // If backend also provided scores, build a map for percentage bars
        if (Array.isArray(obj1Result.career_top_jobs_scores) && obj1Result.career_top_jobs_scores.length === obj1Result.career_top_jobs.length) {
          const map: Record<string, number> = {};
          obj1Result.career_top_jobs.forEach((label: string, i: number) => {
            map[label] = obj1Result.career_top_jobs_scores[i];
          });
          setCareerForecast(map);
        } else {
          setCareerForecast(obj1Result.career_top_jobs);
        }
        console.log('Updated top jobs:', obj1Result.career_top_jobs);
      } else if (obj1Result.career_forecast) {
        setCareerForecast(obj1Result.career_forecast);
        console.log('Updated career forecast:', obj1Result.career_forecast);
      }
      
      // Objective 2: RIASEC Archetype Analysis (with tuning params)
      const obj2Resp = await fetch(getApiUrl('OBJECTIVE_2_PROCESS'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          grades: gradeValuesArray,
          order_ids: itOrderIds || [],
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
      console.log('Objective 2 (RIASEC Archetype) result:', obj2Result);
      
      // Update archetype state with results
      if (obj2Result.archetype_analysis) {
        const archetypeData = obj2Result.archetype_analysis;
        if (archetypeData.primary_archetype_debiased) {
          setPrimaryArchetype(archetypeData.primary_archetype_debiased);
        } else if (archetypeData.primary_archetype) {
          setPrimaryArchetype(archetypeData.primary_archetype);
        }
        // Prefer normalized outputs from backend
        const p = (archetypeData.debias_percentages
          || archetypeData.opportunity_normalized_percentages
          || archetypeData.normalized_percentages
          || archetypeData.archetype_percentages) as Record<string, unknown> | undefined;
        if (p) {
          const toNum = (v: unknown): number => {
            const n = Number(v);
            return Number.isFinite(n) ? n : 0;
          };
          const normalized = {
            realistic: toNum((p as any).realistic ?? (p as any).Realistic),
            investigative: toNum((p as any).investigative ?? (p as any).Investigative),
            artistic: toNum((p as any).artistic ?? (p as any).Artistic),
            social: toNum((p as any).social ?? (p as any).Social),
            enterprising: toNum((p as any).enterprising ?? (p as any).Enterprising),
            conventional: toNum((p as any).conventional ?? (p as any).Conventional),
          };
          setArchetypePercents(normalized);
        }
        console.log('Updated archetype data:', archetypeData);
      }
      
      // Skip Objective 3 here; Dashboard will trigger recommendations when needed
      
      // No modal alerts; UI is updated inline via state
      
    } catch (e: unknown) {
      console.error('Processing error:', e);
      const errorMessage = e instanceof Error ? e.message : 'Failed to process analysis';
      alert(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearAnalysisResults = async () => {
    try {
      if (!user.email) { alert('Missing user email'); return; }
      
      // Clear all three objectives
      console.log('Clearing all three objectives...');
      
      const isCS = ((user.course || '').toLowerCase().includes('computer science'));
      const obj1ClearEndpoint = isCS ? 'OBJECTIVE_1_CLEAR_CS' : 'OBJECTIVE_1_CLEAR';
      const clearPromises = [
        fetch(getApiUrl(obj1ClearEndpoint as 'OBJECTIVE_1_CLEAR' | 'OBJECTIVE_1_CLEAR_CS'), {
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
      
      // Reset local UI
      setCareerForecast({});
      setPrimaryArchetype('');
      setArchetypePercents({});
      await fetchProfile(user.email);
      alert('Analysis results removed');
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to clear results';
      alert(errorMessage);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'text-gray-100' : ''
    }`} style={{
      backgroundColor: isDark ? '#1a1a1a' : '#FDFBF7',
      color: !isDark ? '#2d2d2d' : undefined,
      minHeight: '100vh',
      width: '100%'
    }}>
      <nav className={`sticky top-0 z-30 border-b ${
        isDark ? 'border-gray-700/30' : 'border-[#DACAO2]'
      }`} style={{
        backgroundColor: isDark ? '#1a1a1a' : '#FAF3E0'
      }}>
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

       <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className={`rounded-lg border p-8 ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-[#DACAO2]'
        }`} style={{
          backgroundColor: isDark ? '#2c2c2c' : '#FFFFFF'
        }}>
          {/* Header */}
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
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M6 2a1 1 0 00-1 1v1H3.5a.5.5 0 000 1H4v10a2 2 0 002 2h8a2 2 0 002-2V5h.5a.5.5 0 000-1H15V3a1 1 0 00-1-1H6zm1 2V3h7v1H7zm1 3a.75.75 0 011.5 0v7a.75.75 0 01-1.5 0V7zm4 0a.75.75 0 011.5 0v7a.75.75 0 01-1.5 0V7z"/></svg>
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
              {/* Transcript Upload */}
              <TranscriptUpload
                existingTranscript={existingTranscript}
                onTranscriptChange={setExistingTranscript}
                onGradesExtracted={handleGradesExtracted}
                user={user}
                blobUrls={blobUrls}
                onBlobUrlAdd={handleBlobUrlAdd}
                tempTranscriptSizeKB={tempTranscriptSizeKB}
                onTempSizeChange={setTempTranscriptSizeKB}
                // parseOcrText prop removed - just console log
              />

              {/* Program Table Controls */}
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
              </div>

              {/* Grades Table */}
                {showGrades && (
                ((user.course || '').toLowerCase().includes('information technology')) ? (
                  <ITStaticTable
                    key={tableResetKey}
                    grades={grades}
                    onGradesChange={setGrades}
                    isProcessing={isProcessing}
                    prefillGrades={prefill}
                    prefillGradesById={prefillById || Object.fromEntries(grades.map(g => [g.id, g.grade]))}
                    onEmitOrder={setItOrderIds}
                  />
                ) : ((user.course || '').toLowerCase().includes('computer science')) ? (
                  <CStaticTable
                    key={tableResetKey}
                    curriculum="BSCS"
                    grades={grades}
                    onGradesChange={setGrades}
                    isProcessing={isProcessing}
                    prefillGrades={prefill}
                    prefillGradesById={Object.fromEntries(grades.map(g => [g.id, g.grade]))}
                    onEmitOrder={setItOrderIds}
                  />
                ) : (
                  <div className={`rounded-lg border p-6 text-center ${
                    isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-[#DACAO2]'
                  }`} style={{
                    backgroundColor: isDark ? '#2c2c2c' : '#FFFFFF'
                  }}>
                    Program table unavailable. Set your course to Information Technology or Computer Science to view the curriculum table.
                        </div>
                )
              )}

              {/* Temporary: Test rendering table to verify two-decimal grade formatting */}
            

              {/* Certificates Upload */}
       
       

              {/* Analysis Results */}
              <AnalysisResults
                careerForecast={careerForecast}
                primaryArchetype={primaryArchetype}
                archetypePercents={archetypePercents}
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