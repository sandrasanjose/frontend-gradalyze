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

  // Track created blob URLs to revoke later
  const [blobUrls, setBlobUrls] = useState<string[]>([]);
  const [tempTranscriptSizeKB, setTempTranscriptSizeKB] = useState<number | null>(null);

  // Archetype summary state
  const [primaryArchetype, setPrimaryArchetype] = useState<string>('');
  const [archetypePercents, setArchetypePercents] = useState<{
    realistic?: number; investigative?: number; artistic?: number; social?: number; enterprising?: number; conventional?: number;
  }>({});
  const [careerForecast, setCareerForecast] = useState<Record<string, number> | string[]>({});

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

      // Capture archetype percentages for summary
      setPrimaryArchetype(String(data.primary_archetype || ''));
      setArchetypePercents({
        realistic: typeof data.archetype_realistic_percentage === 'number' ? data.archetype_realistic_percentage : undefined,
        investigative: typeof data.archetype_investigative_percentage === 'number' ? data.archetype_investigative_percentage : undefined,
        artistic: typeof data.archetype_artistic_percentage === 'number' ? data.archetype_artistic_percentage : undefined,
        social: typeof data.archetype_social_percentage === 'number' ? data.archetype_social_percentage : undefined,
        enterprising: typeof data.archetype_enterprising_percentage === 'number' ? data.archetype_enterprising_percentage : undefined,
        conventional: typeof data.archetype_conventional_percentage === 'number' ? data.archetype_conventional_percentage : undefined,
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
    
    if (courseLower.includes('information technology')) {
      return [
        // 1st Year 1st Sem
        'it_fy1_icc0101', 'it_fy1_icc0101_1', 'it_fy1_icc0102', 'it_fy1_icc0102_1', 'it_fy1_ipp0010', 'it_fy1_mmw0001', 'it_fy1_pcm0006', 'it_fy1_sts0002', 'it_fy1_aap0007', 'it_fy1_ped0001', 'it_fy1_nstp01',
        // 1st Year 2nd Sem
        'it_fy2_cet0111', 'it_fy2_cet0114', 'it_fy2_cet0114_1', 'it_fy2_eit0121', 'it_fy2_eit0121_1a', 'it_fy2_eit0122', 'it_fy2_eit0123', 'it_fy2_eit0123_1', 'it_fy2_gtb121', 'it_fy2_icc0103', 'it_fy2_icc0103_1', 'it_fy2_ped0013', 'it_fy2_nstp02',
        // 2nd Year 1st Sem
        'it_sy1_cet0121', 'it_sy1_cet0225', 'it_sy1_cet0225_1', 'it_sy1_eit0221', 'it_sy1_eit0221_1', 'it_sy1_eit0222', 'it_sy1_eit0222_1', 'it_sy1_eit0223', 'it_sy1_eit0223_1', 'it_sy1_eit0224', 'it_sy1_eit0224_1', 'it_sy1_eit0225', 'it_sy1_eit0225_1', 'it_sy1_eit0226', 'it_sy1_eit0226_1', 'it_sy1_eit0227', 'it_sy1_eit0227_1', 'it_sy1_ped0021',
        // 2nd Year 2nd Sem
        'it_sy2_eit0321', 'it_sy2_eit0321_1', 'it_sy2_eit0322', 'it_sy2_eit0322_1', 'it_sy2_eit0323', 'it_sy2_eit0323_1', 'it_sy2_eit0324', 'it_sy2_eit0324_1', 'it_sy2_eit0325', 'it_sy2_eit0325_1', 'it_sy2_eit0326', 'it_sy2_eit0326_1', 'it_sy2_eit0327', 'it_sy2_eit0327_1', 'it_sy2_eit0328', 'it_sy2_eit0328_1', 'it_sy2_ped0031',
        // 3rd Year 1st Sem
        'it_ty1_eit0421', 'it_ty1_eit0421_1', 'it_ty1_eit0422', 'it_ty1_eit0422_1', 'it_ty1_eit0423', 'it_ty1_eit0423_1', 'it_ty1_eit0424', 'it_ty1_eit0424_1', 'it_ty1_eit0425', 'it_ty1_eit0425_1', 'it_ty1_eit0426', 'it_ty1_eit0426_1', 'it_ty1_eit0427', 'it_ty1_eit0427_1', 'it_ty1_eit0428', 'it_ty1_eit0428_1', 'it_ty1_ped0041',
        // 3rd Year 2nd Sem
        'it_ty2_eit0521', 'it_ty2_eit0521_1', 'it_ty2_eit0522', 'it_ty2_eit0522_1', 'it_ty2_eit0523', 'it_ty2_eit0523_1', 'it_ty2_eit0524', 'it_ty2_eit0524_1', 'it_ty2_eit0525', 'it_ty2_eit0525_1', 'it_ty2_eit0526', 'it_ty2_eit0526_1', 'it_ty2_eit0527', 'it_ty2_eit0527_1', 'it_ty2_eit0528', 'it_ty2_eit0528_1', 'it_ty2_ped0051',
        // 4th Year 1st Sem
        'it_fy1_eit0621', 'it_fy1_eit0621_1', 'it_fy1_eit0622', 'it_fy1_eit0622_1', 'it_fy1_eit0623', 'it_fy1_eit0623_1', 'it_fy1_eit0624', 'it_fy1_eit0624_1', 'it_fy1_eit0625', 'it_fy1_eit0625_1', 'it_fy1_eit0626', 'it_fy1_eit0626_1', 'it_fy1_eit0627', 'it_fy1_eit0627_1', 'it_fy1_eit0628', 'it_fy1_eit0628_1', 'it_fy1_ped0061',
        // 4th Year 2nd Sem
        'it_fy2_eit0721', 'it_fy2_eit0721_1', 'it_fy2_eit0722', 'it_fy2_eit0722_1', 'it_fy2_eit0723', 'it_fy2_eit0723_1', 'it_fy2_eit0724', 'it_fy2_eit0724_1', 'it_fy2_eit0725', 'it_fy2_eit0725_1', 'it_fy2_eit0726', 'it_fy2_eit0726_1', 'it_fy2_eit0727', 'it_fy2_eit0727_1', 'it_fy2_eit0728', 'it_fy2_eit0728_1', 'it_fy2_ped0071',
        // 4th Year 2nd Sem (Additional)
        'it_fy2_eit_elective1', 'it_fy2_eit_elective2', 'it_fy2_eit_elective3', 'it_fy2_eit_elective4', 'it_fy2_eit_elective5', 'it_fy2_eit_elective6',
        // 4th Year 2nd Sem (Final)
        'iip0101a', 'iip0101_1'
      ];
    } else if (courseLower.includes('computer science')) {
      return [
        // CS curriculum would go here with similar structure
        // For now, return empty array
      ];
    }
    
    // Return empty array if course not recognized
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

  // When table order is known and we have cached grades, prefill the selects
  useEffect(() => {
    if (!savedGradesCache || !itOrderIds || itOrderIds.length === 0) return;
    const arr = extractGradeValuesInOrder(savedGradesCache, user.course);
    setPrefill(arr.map(n => parseFloat(Number(n).toFixed(2))));
    // Also reflect rows state so analysis/persistence functions have data
    setGrades(savedGradesCache);
    // apply once
    setSavedGradesCache(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itOrderIds, savedGradesCache]);

  const [prefill, setPrefill] = useState<number[]>([]);
  const handleGradesExtracted = (extractedGrades: unknown[]) => {
    console.log('[OCR] handling grades for prefill:', extractedGrades);
    
    if (Array.isArray(extractedGrades) && extractedGrades.length > 0) {
      // Check if it's structured grade objects (new format)
      const firstGrade = extractedGrades[0];
      if (firstGrade && typeof firstGrade === 'object' && 'grade' in firstGrade) {
        console.log('[OCR] Structured grades detected, converting to numeric array');
        const numericGrades = extractedGrades.map(g => {
          const grade = g as { grade: unknown };
          return typeof grade.grade === 'string' || typeof grade.grade === 'number' 
            ? parseFloat(String(grade.grade)) 
            : 0;
        });
        setPrefill(numericGrades.map(n => parseFloat(Number(n).toFixed(2))));
        
        // Also populate the grades table with the structured data
        const gradeRows = extractedGrades.map((g, index) => {
          const gradeObj = g as { 
            id?: unknown; 
            subject?: unknown; 
            courseCode?: unknown; 
            units?: unknown; 
            grade: unknown; 
            semester?: unknown; 
          };
          return {
            id: typeof gradeObj.id === 'string' ? gradeObj.id : `G-${index + 1}`,
            subject: typeof gradeObj.subject === 'string' ? gradeObj.subject : `Subject ${index + 1}`,
            courseCode: typeof gradeObj.courseCode === 'string' ? gradeObj.courseCode : '',
            units: typeof gradeObj.units === 'number' ? gradeObj.units : 3,
            grade: typeof gradeObj.grade === 'string' || typeof gradeObj.grade === 'number' 
              ? parseFloat(String(gradeObj.grade)) 
              : 0,
            semester: typeof gradeObj.semester === 'string' ? gradeObj.semester : ''
          };
        });
        setGrades(gradeRows);
        console.log('[OCR] Populated grades table with', gradeRows.length, 'courses');
      } 
      // Check if it's numeric array (old format)
      else if (extractedGrades.every(g => typeof g === 'number')) {
        console.log('[OCR] Numeric grades detected');
        setPrefill(extractedGrades.map(n => parseFloat(Number(n).toFixed(2))));
        setGrades(normalizeToRows([])); // rows will be created by table change handlers upon prefill
      }
    }
    setShowGrades(true);
  };

  // Removed parseOcrText function - just focus on console logging

  const handleBlobUrlAdd = (url: string) => {
    setBlobUrls(prev => [...prev, url]);
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
        grade.grade <= 0 || 
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

      // Call all three objectives individually
      console.log('Processing all three objectives...');
      
      // Extract just the grade values in curriculum order
      const gradeValuesArray = extractGradeValuesInOrder(grades, user.course);
      
      // Log the grades array being sent to backend
      console.log('=== GRADES ARRAY BEING SENT TO BACKEND ===');
      console.log('Original grades from table:', grades.length);
      console.log('Grade values array length:', gradeValuesArray.length);
      console.log('Grade values array:', gradeValuesArray);
      console.log('=== END GRADES ARRAY ===');

       // Objective 1: Career Forecasting
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
      
      // Objective 2: RIASEC Archetype Analysis
      const obj2Resp = await fetch(getApiUrl('OBJECTIVE_2_PROCESS'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, grades: gradeValuesArray, order_ids: itOrderIds || [] })
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
        if (archetypeData.primary_archetype) {
          setPrimaryArchetype(archetypeData.primary_archetype);
        }
        if (archetypeData.archetype_percentages) {
          setArchetypePercents(archetypeData.archetype_percentages);
        }
        console.log('Updated archetype data:', archetypeData);
      }
      
      // Skip Objective 3 here; Dashboard will trigger recommendations when needed
      
      // Refresh profile to get updated data (including top jobs)
      await fetchProfile(user.email);
      
      // No modal alerts; UI is updated inline via state and profile refresh
      
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

              {/* Program Table Toggle */}
              <div className="mt-2">
              <button 
                    onClick={() => setShowGrades(!showGrades)}
                    disabled={isProcessing}
                    className={`px-3 py-2 rounded-md text-sm ${isProcessing ? (isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-400 text-gray-600') : (isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800')}`}
                  >
                    {showGrades ? 'Hide Program Table' : 'Show Program Table'}
              </button>
            </div>

              {/* Grades Table */}
                {showGrades && (
                ((user.course || '').toLowerCase().includes('information technology')) ? (
                  <ITStaticTable grades={grades} onGradesChange={setGrades} isProcessing={isProcessing} prefillGrades={prefill} onEmitOrder={setItOrderIds} />
                ) : ((user.course || '').toLowerCase().includes('computer science')) ? (
                  <CStaticTable grades={grades} onGradesChange={setGrades} isProcessing={isProcessing} prefillGrades={prefill} onEmitOrder={setItOrderIds} />
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