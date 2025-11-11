import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiUrl } from '../config/api';
// import { gradesService } from '../services/gradesService';
import AnalysisResults from '../analyiscomponents/AnalysisResults';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeToggle } from '../components/ThemeToggle';

export type GradeRow = {
  id: string;
  subject: string;
  courseCode?: string;
  units: number;
  grade: number;
  semester: string;
};

type ExistingTranscript = {
  hasFile: boolean;
  fileName?: string;
  url?: string;
  _temp?: boolean;
  storagePath?: string;
};

type User = {
  id: number;
  name: string;
  email: string;
  course: string;
  student_number: string;
};

const DossierPage = () => {
  const { isDark } = useTheme();
  const [user, setUser] = useState<User>({ id: 0, name: '', email: '', course: '', student_number: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [existingTranscript, setExistingTranscript] = useState<ExistingTranscript | null>(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // const [grades, setGrades] = useState<GradeRow[]>([]);

  const [primaryArchetype, setPrimaryArchetype] = useState<string>('');
  const [archetypePercents, setArchetypePercents] = useState<{
    realistic?: number; investigative?: number; artistic?: number; social?: number; enterprising?: number; conventional?: number;
  }>({});
  const [careerForecast, setCareerForecast] = useState<Record<string, number> | string[]>({});
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

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
    return () => {};
  }, []);

  const getProfessionalSummary = (type: string, course: string): { headline: string; details: string } => {
    const courseLabel = course || 'Information Technology';
    const base1 = `This academic career dossier synthesizes a comprehensive review of the student's performance throughout the ${courseLabel} program at Pamantasan ng Lungsod ng Maynila.`;
    const t = (type || '').toLowerCase();
    switch (t) {
      case 'investigative':
        return {
          headline: `${base1} The assessment highlights strong proficiency in analytical and research-oriented competencies, with consistent achievement across mathematics, algorithms, data structures, and applied data analysis. Coursework and project outputs indicate depth in experimental design, evidence-based reasoning, and the capacity to translate complex datasets into reliable, scalable solutions.`,
          details: 'The student demonstrates a well-structured competency profile characterized by technical rigor and methodical problem solving. The analysis suggests high alignment with roles in data science, AI/ML engineering, systems analysis, and research engineering within technology-driven organizations. Academic records further indicate readiness for independent inquiry and cross-functional collaboration, supporting contributions to model development, systems modeling, and decision-support tooling.'
        };
      case 'artistic':
        return {
          headline: `${base1} Results reveal pronounced strengths in creative computing and human-centered design, reflected in excellence across UI/UX, interaction design, multimedia applications, and front-end engineering. Project work demonstrates fluency in visual communication, prototyping, and turning abstract concepts into intuitive, high-impact user experiences.`,
          details: 'The competency profile balances aesthetic sensibilities with technical execution, indicating strong suitability for roles in product design, front-end development, game and interactive media, and user research. Academic performance shows adaptability in both individual and team settings, with the ability to rapidly iterate on design hypotheses and incorporate feedback into polished, accessible interfaces.'
        };
      case 'social':
        return {
          headline: `${base1} Evidence points to advanced collaboration and communication skills, with high performance in team-based coursework, IT support activities, and stakeholder-facing deliverables. The record reflects strength in facilitation, knowledge transfer, and translating user needs into practical, service-oriented solutions.`,
          details: 'The student’s profile indicates strong fit for roles in IT support, systems training, customer success, and community technology initiatives. Performance trends suggest effectiveness in environments requiring empathy, clear documentation, and continuous user engagement, enabling smooth onboarding, sustained adoption, and impactful change management across organizations.'
        };
      case 'enterprising':
        return {
          headline: `${base1} The assessment underscores strategic and leadership-oriented competencies, including project planning, product thinking, and structured delivery. Academic performance in entrepreneurship, project management, and cross-functional coordination courses demonstrates capacity to define outcomes, align teams, and execute toward measurable impact.`,
          details: 'The competency profile aligns strongly with product management, project coordination, and venture-building roles. The student’s work shows fluency in translating business requirements into technical roadmaps, managing risk, and communicating priorities across stakeholders—skills essential to driving initiatives from concept through completion in dynamic organizations.'
        };
      case 'realistic':
        return {
          headline: `${base1} Results emphasize practical engineering strengths in implementation, configuration, and system troubleshooting. High performance across systems administration, networking, and lab-based courses indicates reliability in building and maintaining robust, performance-oriented infrastructure.`,
          details: 'The student exhibits strong alignment with roles in systems administration, network engineering, site reliability, and hardware support. Academic evidence suggests a disciplined approach to root-cause analysis, operational excellence, and preventive maintenance—capabilities that support dependable, scalable operations in production environments.'
        };
      case 'conventional':
        return {
          headline: `${base1} The analysis shows pronounced strengths in organization, documentation, and data stewardship. Consistent results in database management, information systems, QA, and technical writing reflect precision, process adherence, and an eye for detail.`,
          details: 'The competency profile aligns with database administration, quality assurance, systems auditing, and technical documentation roles. Academic patterns indicate reliability in structured workflows, versioned artifacts, and compliance-focused deliverables, supporting trustworthy operations and continuous improvement across teams.'
        };
      default:
        return {
          headline: `${base1} Performance data indicates a balanced competency profile, with evidence of steady growth across core computing subjects and applied project work.`,
          details: 'The record suggests broad-based readiness for early-career roles across software development and IT operations, with the adaptability to specialize further through targeted experience and continued learning in industry contexts.'
        };
    }
  };

  // const normalizeToRows = (raw: any[]): GradeRow[] => {
  //   if (!Array.isArray(raw)) return [];
  //   return raw
  //     .map((g, idx) => {
  //       const subject = g.subject || g.course || g.code || g.name || 'Unknown Subject';
  //       const units = Number(g.units ?? g.credit_units ?? g.credits ?? 0) || 0;
  //       const grade = parseFloat((Number(g.grade ?? g.final_grade ?? g.rating ?? 0) || 0).toFixed(2));
  //       const semester = String(g.semester ?? g.term ?? g.period ?? 'N/A');
  //       return { id: `${Date.now()}_${idx}`, subject, units, grade, semester } as GradeRow;
  //     })
  //     .filter(r => r.subject && r.subject !== 'Unknown Subject');
  // };

  // Program table logic removed on Dossier view

  // Grade formatting removed

  const fetchProfile = async (email: string) => {
    try {
      const res = await fetch(`${getApiUrl('PROFILE_BY_EMAIL')}?email=${encodeURIComponent(email)}`);
      if (!res.ok) throw new Error('Failed to load profile');
      const data = await res.json();

      const hasValidTorUrl = !!(typeof data.tor_url === 'string' && data.tor_url.trim() !== '');
      const hasValidTorPath = !!(typeof data.tor_storage_path === 'string' && data.tor_storage_path.trim() !== '');
      const hasTor = hasValidTorUrl && hasValidTorPath;
      if (hasTor) {
        const url: string = data.tor_url.trim();
        setExistingTranscript({ hasFile: true, fileName: data.tor_storage_path.split('/').pop() || 'transcript.pdf', url, storagePath: data.tor_storage_path });
      } else {
        setExistingTranscript({ hasFile: false });
      }

      if (data.tor_notes) {
        try {
          const parsed = JSON.parse(data.tor_notes);
          // careers
          const cf = parsed?.analysis_results?.career_forecast;
          if (cf && typeof cf === 'object') setCareerForecast(cf);

          // archetypes: prefer backend debiased/normalized if present
          const arch = parsed?.analysis_results?.archetype_analysis;
          const norm = arch?.debias_percentages || arch?.opportunity_normalized_percentages || arch?.normalized_percentages || arch?.archetype_percentages;
          if (norm && typeof norm === 'object') {
            // Map to lowercase keys expected by AnalysisResults
            const map: any = {};
            const pull = (k: string) => (typeof norm[k] === 'number' ? norm[k] : (typeof norm[k?.toLowerCase?.()] === 'number' ? norm[k.toLowerCase()] : undefined));
            map.realistic = pull('Realistic');
            map.investigative = pull('Investigative');
            map.artistic = pull('Artistic');
            map.social = pull('Social');
            map.enterprising = pull('Enterprising');
            map.conventional = pull('Conventional');
            setArchetypePercents(map);
          }
          if (typeof arch?.primary_archetype_debiased === 'string') {
            setPrimaryArchetype(arch.primary_archetype_debiased);
          } else if (typeof arch?.primary_archetype === 'string') {
            setPrimaryArchetype(arch.primary_archetype);
          }
        } catch (error) {
          console.error('Error:', error);
        }
      }

      setUser((prev) => ({
        id: typeof data?.id === 'number' ? data.id : prev.id,
        name: String(data?.name || prev.name || ''),
        email: String(data?.email || prev.email || ''),
        course: String(data?.course || prev.course || ''),
        student_number: String(data?.student_number || prev.student_number || ''),
      }));

      setPrimaryArchetype(String(data.primary_archetype || ''));
      // Only set fallback raw columns if we did not already set from tor_notes normalized above
      setArchetypePercents((prev) => {
        const already = Object.values(prev || {}).some((v) => typeof v === 'number');
        if (already) return prev;
        return {
          realistic: typeof data.archetype_realistic_percentage === 'number' ? data.archetype_realistic_percentage : undefined,
          investigative: typeof data.archetype_investigative_percentage === 'number' ? data.archetype_investigative_percentage : undefined,
          artistic: typeof data.archetype_artistic_percentage === 'number' ? data.archetype_artistic_percentage : undefined,
          social: typeof data.archetype_social_percentage === 'number' ? data.archetype_social_percentage : undefined,
          enterprising: typeof data.archetype_enterprising_percentage === 'number' ? data.archetype_enterprising_percentage : undefined,
          conventional: typeof data.archetype_conventional_percentage === 'number' ? data.archetype_conventional_percentage : undefined,
        };
      });

      let setForecast = false;
      if (Array.isArray(data.career_top_jobs)) {
        if (Array.isArray(data.career_top_jobs_scores) && data.career_top_jobs_scores.length === data.career_top_jobs.length) {
          const map: Record<string, number> = {};
          data.career_top_jobs.forEach((label: string, i: number) => { map[label] = data.career_top_jobs_scores[i]; });
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
  };

  // Removed saved grades/prefill logic

  const handleGeneratePDF = async () => {
    let wrapper: HTMLDivElement | null = null;
    try {
      setIsGeneratingPDF(true);
      const content = document.getElementById('dossier-content');
      if (!content) {
        console.error('PDF export: #dossier-content not found');
        alert('Unable to export: content not found. Please reload the page and try again.');
        return;
      }

      // Build a light (white) theme wrapper for export
      wrapper = document.createElement('div');
      wrapper.className = 'pdf-light';
      wrapper.style.padding = '6px';
      wrapper.style.background = '#ffffff';
      wrapper.style.color = '#111827';
      // Set A4-friendly width in CSS pixels (~794px at 96dpi)
      wrapper.style.maxWidth = '794px';
      wrapper.style.width = '794px';
      wrapper.style.fontSize = '10pt';
      wrapper.style.lineHeight = '1.35';

      const style = document.createElement('style');
      style.innerHTML = `
        .pdf-light { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Noto Sans, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', sans-serif; font-size:10pt; line-height:1.35; }
        .pdf-light * { background: transparent !important; font-size:10pt !important; line-height:1.35 !important; -webkit-background-clip: initial !important; background-clip: initial !important; -webkit-text-fill-color: #111827 !important; }
        .pdf-light .bg-gray-900, .pdf-light .bg-gray-800, .pdf-light .bg-gray-700, .pdf-light .bg-black { background-color: #ffffff !important; }
        .pdf-light .text-white, .pdf-light .text-gray-200, .pdf-light .text-gray-300, .pdf-light .text-gray-400 { color: #111827 !important; }
        .pdf-light .border-gray-800, .pdf-light .border-gray-700, .pdf-light .border-gray-600 { border-color: #cbd5e1 !important; }
        /* Normalize cards: subtle border, light padding, no shadows */
        .pdf-light .rounded-lg, .pdf-light .rounded-md { box-shadow: none; border: 1px solid #e5e7eb !important; background-color: #ffffff !important; padding: 10px !important; border-radius: 6px !important; }
        .pdf-light .mb-2 { margin-bottom: 6px !important; }
        .pdf-light .mb-3, .pdf-light .mb-4 { margin-bottom: 8px !important; }
        .pdf-light .mb-6, .pdf-light .mb-8 { margin-bottom: 10px !important; }
        .pdf-light .p-6, .pdf-light .p-8 { padding: 10px !important; }
        .pdf-light .px-4, .pdf-light .px-6, .pdf-light .px-8 { padding-left: 8px !important; padding-right: 8px !important; }
        .pdf-light .py-4, .pdf-light .py-6, .pdf-light .py-8 { padding-top: 8px !important; padding-bottom: 8px !important; }
        /* Default heading sizes to keep charts unchanged */
        .pdf-light h1, .pdf-light h2, .pdf-light h3 { color: #111827 !important; margin: 0 0 6px 0; }
        .pdf-light h1 { font-size: 12pt !important; }
        .pdf-light h2 { font-size: 11pt !important; }
        .pdf-light h3 { font-size: 10.5pt !important; }
        .pdf-light .text-green-400, .pdf-light .text-blue-400, .pdf-light .text-purple-400 { color: #0f172a !important; }
        .pdf-light .bg-gradient-to-r, .pdf-light .bg-gradient-to-br { background-image: none !important; background-color: #ffffff !important; }
        .pdf-light .progress-bar { background-color: #2563eb !important; }
        /* Default paragraph/text size */
        .pdf-light p { font-size: 10pt !important; line-height: 1.35 !important; }
        .pdf-light .text-xs, .pdf-light .text-sm, .pdf-light .text-base, .pdf-light .text-lg, .pdf-light .text-xl, .pdf-light .text-2xl, .pdf-light .text-3xl, .pdf-light .text-4xl, .pdf-light .text-5xl, .pdf-light .text-6xl { font-size: 10pt !important; }
        /* Larger text only for summaries */
        .pdf-light .exec-summary h3, .pdf-light .prof-summary h3 { font-size: 12pt !important; margin-bottom: 10px !important; }
        .pdf-light .exec-summary p, .pdf-light .prof-summary p { font-size: 11pt !important; line-height: 1.45 !important; }
        .pdf-light .h-2 { height: 4px !important; }
        /* Force simple hex colors everywhere to avoid unsupported oklch parsing */
        .pdf-light, .pdf-light * { color: #111827 !important; background-color: #ffffff !important; border-color: #cbd5e1 !important; background-image: none !important; }
        /* Ensure section spacing between Executive Summary, Charts, and Professional Summary */
        .pdf-light #dossier-content > * { margin-bottom: 20px !important; }
        /* Add distance between headers and their divider lines */
        .pdf-light .border-t { margin-top: 6px !important; margin-bottom: 12px !important; border-color: #cbd5e1 !important; }
        /* Add a bit of space before boxes following section headers */
        .pdf-light .rounded-lg, .pdf-light .rounded-md { margin-top: 10px !important; }
        /* Constrain card heights so columns are not overly tall in PDF */
        .pdf-light .rounded-lg, .pdf-light .rounded-md { max-height: 440px !important; overflow: hidden !important; }
        /* Slightly scale down large visuals (e.g., donut SVG container) */
        .pdf-light .relative.mx-auto { transform: scale(0.9); transform-origin: center center; margin-bottom: -6px !important; }
        /* Tighten vertical gaps in the donut/legend stack */
        .pdf-light .flex.flex-col.items-center { gap: 6px !important; }
        /* Reduce generic top margins that may push legend downward */
        .pdf-light .mt-4 { margin-top: 6px !important; }
        .pdf-light .mt-6 { margin-top: 8px !important; }
        /* Compact grid gaps slightly to avoid overflow */
        .pdf-light .grid { gap: 10px !important; }
        /* Force header to pure black with no gradient or blending */
        .pdf-light .pdf-header, .pdf-light .pdf-header * {
          color: #000000 !important;
          -webkit-text-fill-color: #000000 !important;
          background: none !important;
          background-image: none !important;
          -webkit-background-clip: initial !important;
          background-clip: initial !important;
          opacity: 1 !important;
          mix-blend-mode: normal !important;
          filter: none !important;
          text-shadow: none !important;
        }
        /* Align icon with text in the red callout (Recommended Career Path) */
        .pdf-light .flex.items-center.gap-2.mb-1 { display: flex !important; align-items: center !important; line-height: 1.2 !important; }
        .pdf-light .flex.items-center.gap-2.mb-1 > svg { width: 14px !important; height: 14px !important; display: block !important; }
        .pdf-light .flex.items-center.gap-2.mb-1 > span { display: inline-flex !important; align-items: center !important; line-height: 1.2 !important; padding-bottom: 1px !important; }

        /* Hide the icon in the callout when exporting to PDF */
        .pdf-light .flex.items-center.gap-2.mb-1 > svg { display: none !important; }

        /* Make the callout label bold in PDF */
        .pdf-light .border-red-200 .text-sm.font-medium,
        .pdf-light .border-red-700 .text-sm.font-medium { font-weight: 700 !important; }

        /* Make donut center texts bigger for PDF */
        .pdf-light svg text[data-center="pct"] { font-size: 34px !important; font-weight: 800 !important; }
        .pdf-light svg text[data-center="title"] { font-size: 14px !important; font-weight: 600 !important; }
        .pdf-light svg text[data-center="label"] { font-size: 10px !important; letter-spacing: 0.08em !important; }
      `;

      const header = document.createElement('div');
      header.style.marginBottom = '12px';
      header.innerHTML = `<div class="pdf-header" style="text-align:center;color:#000000">
        <div style=\"font-size:20px;font-weight:700;color:#000000;\">${user.name || 'Student'}</div>
        <div style=\"font-size:12px;opacity:0.95;color:#000000;\">${user.course || ''}</div>
        <div style=\"font-size:12px;opacity:0.95;color:#000000;\">Pamantasan ng Lungsod ng Maynila</div>
      </div>`;

      const cloned = content.cloneNode(true) as HTMLElement;
      wrapper.appendChild(style);
      wrapper.appendChild(header);
      wrapper.appendChild(cloned);
      // Add to DOM offscreen so measurement works reliably
      wrapper.style.position = 'fixed';
      wrapper.style.left = '-10000px';
      wrapper.style.top = '0';
      document.body.appendChild(wrapper);

      // Wait a tick to allow fonts/assets to settle
      await new Promise((r) => setTimeout(r, 50));

      // Render to canvas and fit to one A4 page (higher-resolution capture)
      const canvas = await (html2canvas as any)(wrapper, {
        background: '#ffffff',
        useCORS: true,
        allowTaint: false,
        scale: 2,
        width: 794,
        height: 1123,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 8; // mm
      const maxW = pageWidth - margin * 2;
      const maxH = pageHeight - margin * 2;
      const imgW = maxW;
      const imgH = (canvas.height / canvas.width) * imgW;
      const finalH = imgH > maxH ? maxH : imgH;
      const finalW = imgH > maxH ? (canvas.width / canvas.height) * maxH : imgW;
      const offsetX = (pageWidth - finalW) / 2;
      const offsetY = (pageHeight - finalH) / 2;
      pdf.addImage(imgData, 'PNG', offsetX, offsetY, finalW, finalH);
      pdf.save('Professional_Dossier.pdf');
    } catch (e) {
      console.error('PDF export failed:', e);
      alert('PDF download failed. Please check the console for details and try again.');
    } finally {
      if (wrapper && wrapper.parentNode) {
        try { wrapper.parentNode.removeChild(wrapper); } catch {}
      }
      setIsGeneratingPDF(false);
    }
  };

  // No upload handlers on Dossier view

  // analyze/clear actions intentionally omitted on Dossier view

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'text-gray-100' : ''
    }`} style={{
      backgroundColor: isDark ? '#1a1a1a' : '#FDFBF7',
      color: !isDark ? '#2d2d2d' : undefined
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
                      isDark ? 'border-gray-700' : 'border-[#DACA02]'
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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded-sm"></div>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Professional Dossier</h2>
            </div>
          <div className="flex items-center gap-2">
              <button 
                onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-gray-700 hover:bg-gray-600 border border-gray-600 text-white shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Refresh Data
              </button>
              <button 
                onClick={handleGeneratePDF}
              disabled={isGeneratingPDF}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm border text-white shadow-sm ${isGeneratingPDF ? 'bg-gray-600 border-gray-600' : 'bg-blue-600 hover:bg-blue-500 border-blue-500'}`}>
                {isGeneratingPDF ? (
                  <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Generating...
                  </>
                ) : (
                  <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Download PDF
                  </>
                )}
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading…</div>
          ) : (
            <div id="dossier-content" className="space-y-8">
            {/* Executive Summary (plain text) */}
              <div className="mb-2 exec-summary">
                <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Executive Summary</h3>
                <div className={`border-t ${isDark ? 'border-gray-700' : 'border-[#DACAO2]'} mb-3`} />
                <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Visual synopsis of quantitative findings from comprehensive academic analysis. Charts and metrics represent statistical distributions of competency archetypes and career trajectory predictions derived from performance data.
                </p>
              </div>

              {/* Program table removed on Dossier view */}

              <AnalysisResults
                careerForecast={careerForecast}
                primaryArchetype={primaryArchetype}
                archetypePercents={archetypePercents}
                existingTranscript={existingTranscript}
                twoColumn
              />

              {/*Professional Summary*/}
              <div className="mb-2 prof-summary">
                <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Professional Summary</h3>
                <div className={`border-t ${isDark ? 'border-gray-700' : 'border-[#DACAO2]'} mb-3`} />
                {(() => {
                  const s = getProfessionalSummary(primaryArchetype || 'Analysis Required', user.course);
                  const entries = Object.entries(archetypePercents || {}).filter(([, v]) => typeof v === 'number') as [string, number][];
                  const secondary = entries
                    .sort((a, b) => b[1] - a[1])
                    .filter(([k]) => (k.toLowerCase() !== (primaryArchetype || '').toLowerCase()))
                    .slice(0, 2)
                    .map(([k]) => k.charAt(0).toUpperCase() + k.slice(1))
                    .join(' and ');
                  return (
                    <div className="space-y-3">
                      <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{s.headline}</p>
                      <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{s.details}{secondary ? ` Secondary strengths include ${secondary}, enabling effective cross-functional collaboration.` : ''}</p>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DossierPage;
