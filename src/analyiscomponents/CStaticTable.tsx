// /components/CStaticTable.tsx
import { useEffect, useRef, useState } from 'react';
import type { GradeRow } from '../pages/AnalysisPage';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
  curriculum: 'BSCS'; // Future-proofing for other curricula
  grades: GradeRow[];
  onGradesChange: (grades: GradeRow[]) => void;
  isProcessing: boolean;
  prefillGrades?: number[];
  prefillGradesById?: Record<string, number>;
  onEmitOrder?: (ids: string[]) => void;
}

interface Course {
  id: string;
  code: string;
  title: string;
  units: number;
}

interface Semester {
  title: string;
  courses: Course[];
}

const CURRICULUM_DATA: Record<Props['curriculum'], Semester[]> = {
  BSCS: [
    {
      title: 'First Year - 1st Semester',
      courses: [
        { id: 'cs_fy1_csc0102', code: 'CSC 0102', title: 'Discrete Structures 1', units: 3 },
        { id: 'cs_fy1_icc0101', code: 'ICC 0101', title: 'Introduction to Computing (Lecture)', units: 2 },
        { id: 'cs_fy1_icc0101_1', code: 'ICC 0101.1', title: 'Introduction to Computing (Laboratory)', units: 1 },
        { id: 'cs_fy1_icc0102', code: 'ICC 0102', title: 'Fundamentals of Programming (Lecture)', units: 2 },
        { id: 'cs_fy1_icc0102_1', code: 'ICC 0102.1', title: 'Fundamentals of Programming (Laboratory)', units: 1 },
        { id: 'cs_fy1_ipp0010', code: 'IPP 0010', title: 'Interdisiplinaryong Pagbasa at Pagsulat Tungo sa Mabisang Pagpapahayag', units: 3 },
        { id: 'cs_fy1_mmw0001', code: 'MMW 0001', title: 'Mathematics in the Modern World', units: 3 },
        { id: 'cs_fy1_ped0001', code: 'PED 0001', title: 'Foundation of Physical Activities', units: 2 },
        { id: 'cs_fy1_pcm0006', code: 'PCM 0006', title: 'Purposive Communication', units: 3 },
        { id: 'cs_fy1_sts0002', code: 'STS 0002', title: 'Science, Technology and Society', units: 3 },
        { id: 'cs_fy1_nstp01', code: 'NSTP 01', title: 'National Service Training Program 1', units: 3 },
      ],
    },
    {
      title: 'First Year - 2nd Semester',
      courses: [
        { id: 'cs_fy2_csc0211', code: 'CSC 0211', title: 'Discrete Structures 2', units: 3 },
        { id: 'cs_fy2_csc0223', code: 'CSC 0223', title: 'Human Computer Interaction', units: 3 },
        { id: 'cs_fy2_icc0103', code: 'ICC 0103', title: 'Intermediate Programming (Lecture)', units: 2 },
        { id: 'cs_fy2_icc0103_1', code: 'ICC 0103.1', title: 'Intermediate Programming (Laboratory)', units: 1 },
        { id: 'cs_fy2_icc0104', code: 'ICC 0104', title: 'Data Structures and Algorithms (Lecture)', units: 2 },
        { id: 'cs_fy2_icc0104_1', code: 'ICC 0104.1', title: 'Data Structures and Algorithms (Laboratory)', units: 1 },
        { id: 'cs_fy2_lwr0009', code: 'LWR 0009', title: 'Life and Works of Rizal', units: 3 },
        { id: 'cs_fy2_ped0012', code: 'PED 0012', title: 'Group Exercise', units: 2 },
        { id: 'cs_fy2_rph0004', code: 'RPH 0004', title: 'Readings in Philippine History', units: 3 },
        { id: 'cs_fy2_tcw0005', code: 'TCW 0005', title: 'The Contemporary World', units: 3 },
        { id: 'cs_fy2_nstp02', code: 'NSTP 02', title: 'National Service Training Program 2', units: 3 },
      ],
    },
    {
      title: 'Second Year - 1st Semester',
      courses: [
        { id: 'cs_sy1_csc0212', code: 'CSC 0212', title: 'Object Oriented Programming (Lecture)', units: 2 },
        { id: 'cs_sy1_csc0212_1', code: 'CSC 0212.1', title: 'Object Oriented Programming (Laboratory)', units: 1 },
        { id: 'cs_sy1_csc0213', code: 'CSC 0213', title: 'Logic Design and Digital Computer Circuits (Lecture)', units: 2 },
        { id: 'cs_sy1_csc0213_1', code: 'CSC 0213.1', title: 'Logic Design and Digital Computer Circuits (Laboratory)', units: 1 },
        { id: 'cs_sy1_csc0224', code: 'CSC 0224', title: 'Operation Research', units: 3 },
        { id: 'cs_sy1_eth0008', code: 'ETH 0008', title: 'Ethics', units: 3 },
        { id: 'cs_sy1_icc0105', code: 'ICC 0105', title: 'Information Management (Lecture)', units: 2 },
        { id: 'cs_sy1_icc0105_1', code: 'ICC 0105.1', title: 'Information Management (Laboratory)', units: 1 },
        { id: 'cs_sy1_ite0001', code: 'ITE 0001', title: 'Living in the IT Era', units: 3 },
        { id: 'cs_sy1_ped0074', code: 'PED 0074', title: 'PE Elective', units: 2 },
        { id: 'cs_sy1_uts0003', code: 'UTS 0003', title: 'Understanding the Self', units: 3 },
      ],
    },
    {
      title: 'Second Year - 2nd Semester',
      courses: [
        { id: 'cs_sy2_cbm0016', code: 'CBM 0016', title: 'The Entrepreneurial Mind', units: 3 },
        { id: 'cs_sy2_csc0221', code: 'CSC 0221', title: 'Algorithm and Complexity', units: 3 },
        { id: 'cs_sy2_csc0222', code: 'CSC 0222', title: 'Architecture and Organization (Lecture)', units: 2 },
        { id: 'cs_sy2_csc0222_1', code: 'CSC 0222.1', title: 'Architecture and Organization (Laboratory)', units: 1 },
        { id: 'cs_sy2_csc0316', code: 'CSC 0316', title: 'Information Assurance Security', units: 3 },
        { id: 'cs_sy2_ges0013', code: 'GES 0013', title: 'Environmental Science', units: 3 },
        { id: 'cs_sy2_icc0106', code: 'ICC 0106', title: 'Applications Development and Emerging Technologies (Lecture)', units: 2 },
        { id: 'cs_sy2_icc0106_1', code: 'ICC 0106.1', title: 'Applications Development and Emerging Technologies (Laboratory)', units: 1 },
        { id: 'cs_sy2_ped0023', code: 'PED 0023', title: 'PE Elective', units: 2 },
        { id: 'cs_sy2_aap0007', code: 'AAP 0007', title: 'Art Appreciation', units: 3 },
      ],
    },
    {
      title: 'Third Year - 1st Semester',
      courses: [
        { id: 'cs_ty1_csc0311', code: 'CSC 0311', title: 'Automata Theory and Formal Languages', units: 3 },
        { id: 'cs_ty1_csc0312', code: 'CSC 0312', title: 'Programming Languages (Lecture)', units: 2 },
        { id: 'cs_ty1_csc0312_1', code: 'CSC 0312.1', title: 'Programming Languages (Laboratory)', units: 1 },
        { id: 'cs_ty1_csc0313', code: 'CSC 0313', title: 'Software Engineering (Lecture)', units: 2 },
        { id: 'cs_ty1_csc0313_1', code: 'CSC 0313.1', title: 'Software Engineering (Laboratory)', units: 1 },
        { id: 'cs_ty1_csc0314', code: 'CSC 0314', title: 'Operating System (Lecture)', units: 2 },
        { id: 'cs_ty1_csc0314_1', code: 'CSC 0314.1', title: 'Operating System (Laboratory)', units: 1 },
        { id: 'cs_ty1_csc0315', code: 'CSC 0315', title: 'Intelligent System (Lecture)', units: 2 },
        { id: 'cs_ty1_csc0315_1', code: 'CSC 0315.1', title: 'Intelligent System (Laboratory)', units: 1 },
      ],
    },
    {
      title: 'Third Year - 2nd Semester',
      courses: [
        { id: 'cs_ty2_csc0321', code: 'CSC 0321', title: 'Software Engineering 2 (Lecture)', units: 2 },
        { id: 'cs_ty2_csc0321_1', code: 'CSC 0321.1', title: 'Software Engineering 2 (Laboratory)', units: 1 },
        { id: 'cs_ty2_csc0322', code: 'CSC 0322', title: 'Compiler Design (Lecture)', units: 2 },
        { id: 'cs_ty2_csc0322_1', code: 'CSC 0322.1', title: 'Compiler Design (Laboratory)', units: 1 },
        { id: 'cs_ty2_csc0323', code: 'CSC 0323', title: 'Computational Science (Lecture)', units: 2 },
        { id: 'cs_ty2_csc0323_1', code: 'CSC 0323.1', title: 'Computational Science (Laboratory)', units: 1 },
        { id: 'cs_ty2_csc0324', code: 'CSC 0324', title: 'CS Elective 1 (Lecture)', units: 2 },
        { id: 'cs_ty2_csc0324_1', code: 'CSC 0324.1', title: 'CS Elective 1 (Laboratory)', units: 1 },
        { id: 'cs_ty2_csc0325', code: 'CSC 0325', title: 'Research Writing', units: 3 },
      ],
    },
    {
      title: 'Third Year - Summer',
      courses: [
        { id: 'cs_ty_csc195_1', code: 'CSC 195.1', title: 'Practicum (240 hrs)', units: 2 },
      ],
    },
    {
      title: 'Fourth Year - 1st Semester',
      courses: [
        { id: 'cs_fy4_csc0411', code: 'CSC 0411', title: 'CS Thesis Writing 1', units: 3 },
        { id: 'cs_fy4_csc0412', code: 'CSC 0412', title: 'Networks and Communication (Lecture)', units: 2 },
        { id: 'cs_fy4_csc0412_1', code: 'CSC 0412.1', title: 'Networks and Communication (Laboratory)', units: 1 },
        { id: 'cs_fy4_csc0413', code: 'CSC 0413', title: 'CS Elective 2 (Lecture)', units: 2 },
        { id: 'cs_fy4_csc0413_1', code: 'CSC 0413.1', title: 'CS Elective 2 (Laboratory)', units: 1 },
        { id: 'cs_fy4_csc0414', code: 'CSC 0414', title: 'CS Elective 3 (Lecture)', units: 2 },
        { id: 'cs_fy4_csc0414_1', code: 'CSC 0414.1', title: 'CS Elective 3 (Laboratory)', units: 1 },
      ],
    },
    {
      title: 'Fourth Year - 2nd Semester',
      courses: [
        { id: 'cs_fy4b_csc0421a', code: 'CSC 0421A', title: 'CS Thesis Writing 2', units: 3 },
        { id: 'cs_fy4b_csc0422', code: 'CSC 0422', title: 'Parallel and Distributing Computing (Lecture)', units: 2 },
        { id: 'cs_fy4b_csc0422_1', code: 'CSC 0422.1', title: 'Parallel and Distributing Computing (Laboratory)', units: 1 },
        { id: 'cs_fy4b_csc0423', code: 'CSC 0423', title: 'Social Issues and Professional Practice', units: 3 },
        { id: 'cs_fy4b_csc0424', code: 'CSC 0424', title: 'Graphics and Visual Computing (Lecture)', units: 2 },
        { id: 'cs_fy4b_csc0424_1', code: 'CSC 0424.1', title: 'Graphics and Visual Computing (Laboratory)', units: 1 },
      ],
    },
  ],
};

const SCALE: string[] = ['1.00', '1.25', '1.50', '1.75', '2.00', '2.25', '2.50', '2.75', '3.00', '5.00'];

// Parent Table styles
const TABLE_STYLES = {
  table: 'min-w-full text-sm text-left border border-gray-700 rounded-md',
  thead: 'bg-gray-900 text-gray-300',
  cell: (isDark: boolean) =>
    `px-3 py-2 border-b border-gray-700 ${
      isDark ? 'text-white bg-[#1e2939]' : 'text-gray-900 bg-[#938872]'
    }`,
  row: (isDark: boolean, isAlternate: boolean) =>
    isAlternate ? (isDark ? 'bg-[#2a2f38]' : 'bg-[#f5f6f7]') : isDark ? 'bg-[#463f3f]' : 'bg-[#e7e2d8]',
  select: 'bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white w-28 font-mono tabular-nums text-right',
  container: (isDark: boolean) =>
    `rounded-lg border p-4 transition-colors ${
      isDark
        ? 'bg-gradient-to-br from-gray-800/50 to-gray-700/50 border-gray-600/50'
        : 'bg-gradient-to-br from-gray-100/50 to-gray-200/50 border-gray-300/50'
    }`,
  headerText: (isDark: boolean) => `text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`,
};

const CStaticTable: React.FC<Props> = ({
  grades,
  onGradesChange,
  isProcessing,
  prefillGrades,
  prefillGradesById,
  onEmitOrder,
}) => {
  const { isDark } = useTheme();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const suppressRef = useRef<boolean>(false);

  // Per-row state (explicit ids; no arrays/maps)
  // --- BSCS Year 1 / First Semester ---
  const [v_csc0102, set_csc0102] = useState('');
  const [v_icc0101, set_icc0101] = useState('');
  const [v_icc0101_1, set_icc0101_1] = useState('');
  const [v_icc0102, set_icc0102] = useState('');
  const [v_icc0102_1, set_icc0102_1] = useState('');
  const [v_ipp0010, set_ipp0010] = useState('');
  const [v_mmw0001, set_mmw0001] = useState('');
  const [v_ped0001, set_ped0001] = useState('');
  const [v_pcm0006, set_pcm0006] = useState('');
  const [v_sts0002, set_sts0002] = useState('');
  const [v_nstp01, set_nstp01] = useState('');

  // --- BSCS Year 1 / Second Semester ---
  const [v_csc0211, set_csc0211] = useState('');
  const [v_csc0223, set_csc0223] = useState('');
  const [v_icc0103, set_icc0103] = useState('');
  const [v_icc0103_1, set_icc0103_1] = useState('');
  const [v_icc0104, set_icc0104] = useState('');
  const [v_icc0104_1, set_icc0104_1] = useState('');
  const [v_lwr0009, set_lwr0009] = useState('');
  const [v_ped0012, set_ped0012] = useState('');
  const [v_rph0004, set_rph0004] = useState('');
  const [v_tcw0005, set_tcw0005] = useState('');
  const [v_nstp02, set_nstp02] = useState('');

  // --- BSCS Year 2 / First Semester ---
  const [v_csc0212, set_csc0212] = useState('');
  const [v_csc0212_1, set_csc0212_1] = useState('');
  const [v_csc0213, set_csc0213] = useState('');
  const [v_csc0213_1, set_csc0213_1] = useState('');
  const [v_csc0224, set_csc0224] = useState('');
  const [v_eth0008, set_eth0008] = useState('');
  const [v_icc0105, set_icc0105] = useState('');
  const [v_icc0105_1, set_icc0105_1] = useState('');
  const [v_ite0001, set_ite0001] = useState('');
  const [v_ped0074, set_ped0074] = useState('');
  const [v_uts0003, set_uts0003] = useState('');

  // --- BSCS Year 2 / Second Semester ---
  const [v_cbm0016, set_cbm0016] = useState('');
  const [v_csc0221, set_csc0221] = useState('');
  const [v_csc0222, set_csc0222] = useState('');
  const [v_csc0222_1, set_csc0222_1] = useState('');
  const [v_csc0316, set_csc0316] = useState('');
  const [v_ges0013, set_ges0013] = useState('');
  const [v_icc0106, set_icc0106] = useState('');
  const [v_icc0106_1, set_icc0106_1] = useState('');
  const [v_ped0023, set_ped0023] = useState('');
  const [v_aap0007, set_aap0007] = useState('');

  // --- BSCS Year 3 / First Semester ---
  const [v_csc0311, set_csc0311] = useState('');
  const [v_csc0312, set_csc0312] = useState('');
  const [v_csc0312_1, set_csc0312_1] = useState('');
  const [v_csc0313, set_csc0313] = useState('');
  const [v_csc0313_1, set_csc0313_1] = useState('');
  const [v_csc0314, set_csc0314] = useState('');
  const [v_csc0314_1, set_csc0314_1] = useState('');
  const [v_csc0315, set_csc0315] = useState('');
  const [v_csc0315_1, set_csc0315_1] = useState('');

  // --- BSCS Year 3 / Second Semester ---
  const [v_csc0321, set_csc0321] = useState('');
  const [v_csc0321_1, set_csc0321_1] = useState('');
  const [v_csc0322, set_csc0322] = useState('');
  const [v_csc0322_1, set_csc0322_1] = useState('');
  const [v_csc0323, set_csc0323] = useState('');
  const [v_csc0323_1, set_csc0323_1] = useState('');
  const [v_csc0324, set_csc0324] = useState('');
  const [v_csc0324_1, set_csc0324_1] = useState('');
  const [v_csc0325, set_csc0325] = useState('');

  // --- BSCS Year 3 / Midyear/Summer Term ---
  const [v_csc195_1, set_csc195_1] = useState('');

  // --- BSCS Year 4 / First Semester ---
  const [v_csc0411, set_csc0411] = useState('');
  const [v_csc0412, set_csc0412] = useState('');
  const [v_csc0412_1, set_csc0412_1] = useState('');
  const [v_csc0413, set_csc0413] = useState('');
  const [v_csc0413_1, set_csc0413_1] = useState('');
  const [v_csc0414, set_csc0414] = useState('');
  const [v_csc0414_1, set_csc0414_1] = useState('');

  // --- BSCS Year 4 / Second Semester ---
  const [v_csc0421a, set_csc0421a] = useState('');
  const [v_csc0422, set_csc0422] = useState('');
  const [v_csc0422_1, set_csc0422_1] = useState('');
  const [v_csc0423, set_csc0423] = useState('');
  const [v_csc0424, set_csc0424] = useState('');
  const [v_csc0424_1, set_csc0424_1] = useState('');

  const upsert = (row: GradeRow) => {
    const idx = grades.findIndex((g) => g.id === row.id);
    if (idx >= 0) {
      const arr = [...grades];
      arr[idx] = row;
      onGradesChange(arr);
    } else {
      onGradesChange([...grades, row]);
    }
  };

  const change = (
    id: string,
    subject: string,
    code: string,
    units: number,
    sem: string,
    val: string,
    setter: (v: string) => void
  ) => {
    setter(val);
    if (suppressRef.current) return;
    let num: number;
    if (!val) {
      num = 0;
    } else {
      const parsed = parseFloat(val);
      num = isFinite(parsed) ? parsed : 0;
    }
    upsert({ id, subject, courseCode: code, units, grade: parseFloat(num.toFixed(2)), semester: sem });
  };

  // Prefill dropdowns sequentially using provided numeric grades (array)
  useEffect(() => {
    if (!prefillGrades || prefillGrades.length === 0) return;
    const container = rootRef.current;
    if (!container) return;
    const selects = Array.from(container.querySelectorAll('select')) as HTMLSelectElement[];
    const toStr = (n: number) => n.toFixed(2);
    suppressRef.current = true;
    const total = Math.min(selects.length, prefillGrades.length);
    const batch = 15;
    let i = 0;
    const run = () => {
      const end = Math.min(i + batch, total);
      for (; i < end; i++) {
        const s = selects[i];
        const val = toStr(prefillGrades[i]);
        if (SCALE.includes(val)) {
          s.value = val;
          const evt = new Event('change', { bubbles: true });
          s.dispatchEvent(evt);
        }
      }
      if (i < total) {
        setTimeout(run, 0);
      } else {
        setTimeout(() => { suppressRef.current = false; }, 0);
      }
    };
    run();
    // no dependencies beyond prefillGrades (rootRef does not change)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillGrades]);

  // Prefill specific selects by id using prefillGradesById
  useEffect(() => {
    if (!prefillGradesById) return;
    const container = rootRef.current;
    if (!container) return;
    suppressRef.current = true;
    const entries = Object.entries(prefillGradesById);
    const total = entries.length;
    const batch = 15;
    let i = 0;
    const run = () => {
      const end = Math.min(i + batch, total);
      for (; i < end; i++) {
        const [id, num] = entries[i] as [string, number];
        const s = container.querySelector<HTMLSelectElement>(`select#${id}`);
        if (!s) continue;
        const val = num.toFixed(2);
        if (SCALE.includes(val)) {
          s.value = val;
          const evt = new Event('change', { bubbles: true });
          s.dispatchEvent(evt);
        }
      }
      if (i < total) {
        setTimeout(run, 0);
      } else {
        setTimeout(() => { suppressRef.current = false; }, 0);
      }
    };
    run();
  }, [prefillGradesById]);

  // Emit the canonical order of select ids once on mount (derived from CURRICULUM_DATA)
  useEffect(() => {
    if (!onEmitOrder) return;
    const ids = CURRICULUM_DATA.BSCS.flatMap((sem) => sem.courses.map((c) => c.id));
    onEmitOrder(ids);
  }, [onEmitOrder]);

  const cellClass = TABLE_STYLES.cell(isDark);

  return (
    <div 
      ref={rootRef}
      className={`space-y-6 ${
        isDark
          ? '[&_tbody>tr:nth-child(odd)]:!bg-[#2a2f38] [&_tbody>tr:nth-child(even)]:!bg-[#2c2c2c]'
          : '[&_tbody>tr:nth-child(odd)]:!bg-[#f5f6f7] [&_tbody>tr:nth-child(even)]:!bg-[#e7e2d8]'
      } ${
        isDark
          ? '[&_select]:!bg-gray-800 [&_select]:!text-white [&_select]:!border-gray-700'
          : '[&_select]:!bg-white [&_select]:!text-gray-900 [&_select]:!border-gray-300'
      }`}
    >
      {/* First Year - 1st Semester */}
      <details className={TABLE_STYLES.container(isDark)} open>
        <summary className={`${TABLE_STYLES.headerText(isDark)} cursor-pointer select-none`}>First Year - 1st Semester</summary>
        <div className="overflow-x-auto">
          <table className={TABLE_STYLES.table}>
            <thead className={TABLE_STYLES.thead}>
              <tr>
                <th className={`${cellClass} w-24`}>Course No.</th>
                <th className={cellClass}>Descriptive Title</th>
                <th className={`${cellClass} text-right w-20`}>Units</th>
                <th className={`${cellClass} text-right w-28`}>Grade</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-3 py-2 border-b border-gray-700 font-mono text-xs">CSC 0102</td>
                <td className="px-3 py-2 border-b border-gray-700">Discrete Structures 1</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">3.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select id="cs_fy1_csc0102" value={v_csc0102} onChange={(e) =>
                      change(
                        'cs_fy1_csc0102',
                        'Discrete Structures 1',
                        'CSC 0102',
                        3,
                        'First Year - 1st Semester',
                        e.target.value,
                        set_csc0102
                      )
                    }
                    className={TABLE_STYLES.select}
                    disabled={isProcessing}
                  >
                    <option value="">--</option>
                    {SCALE.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>

              <tr>
                <td className="px-3 py-2 border-b border-gray-700 font-mono text-xs">ICC 0101</td>
                <td className="px-3 py-2 border-b border-gray-700">Introduction to Computing (Lecture)</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">2.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select
                    id="cs_fy1_icc0101"
                    value={v_icc0101}
                    onChange={(e) =>
                      change(
                        'cs_fy1_icc0101',
                        'Introduction to Computing (Lecture)',
                        'ICC 0101',
                        2,
                        'First Year - 1st Semester',
                        e.target.value,
                        set_icc0101
                      )
                    }
                    className={TABLE_STYLES.select}
                    disabled={isProcessing}
                  >
                    <option value="">--</option>
                    {SCALE.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>

              <tr>
                <td className="px-3 py-2 border-b border-gray-700 font-mono text-xs">ICC 0101.1</td>
                <td className="px-3 py-2 border-b border-gray-700">Introduction to Computing (Laboratory)</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">1.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select
                    id="cs_fy1_icc0101_1"
                    value={v_icc0101_1}
                    onChange={(e) =>
                      change(
                        'cs_fy1_icc0101_1',
                        'Introduction to Computing (Laboratory)',
                        'ICC 0101.1',
                        1,
                        'First Year - 1st Semester',
                        e.target.value,
                        set_icc0101_1
                      )
                    }
                    className={TABLE_STYLES.select}
                    disabled={isProcessing}
                  >
                    <option value="">--</option>
                    {SCALE.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>

              <tr>
                <td className="px-3 py-2 border-b border-gray-700 font-mono text-xs">ICC 0102</td>
                <td className="px-3 py-2 border-b border-gray-700">Fundamentals of Programming (Lecture)</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">2.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select
                    id="cs_fy1_icc0102"
                    value={v_icc0102}
                    onChange={(e) =>
                      change(
                        'cs_fy1_icc0102',
                        'Fundamentals of Programming (Lecture)',
                        'ICC 0102',
                        2,
                        'First Year - 1st Semester',
                        e.target.value,
                        set_icc0102
                      )
                    }
                    className={TABLE_STYLES.select}
                    disabled={isProcessing}
                  >
                    <option value="">--</option>
                    {SCALE.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>

              <tr>
                <td className="px-3 py-2 border-b border-gray-700 font-mono text-xs">ICC 0102.1</td>
                <td className="px-3 py-2 border-b border-gray-700">Fundamentals of Programming (Laboratory)</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">1.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select
                    id="cs_fy1_icc0102_1"
                    value={v_icc0102_1}
                    onChange={(e) =>
                      change(
                        'cs_fy1_icc0102_1',
                        'Fundamentals of Programming (Laboratory)',
                        'ICC 0102.1',
                        1,
                        'First Year - 1st Semester',
                        e.target.value,
                        set_icc0102_1
                      )
                    }
                    className={TABLE_STYLES.select}
                    disabled={isProcessing}
                  >
                    <option value="">--</option>
                    {SCALE.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>

              <tr>
                <td className="px-3 py-2 border-b border-gray-700 font-mono text-xs">IPP 0010</td>
                <td className="px-3 py-2 border-b border-gray-700">
                  Interdisiplinaryong Pagbasa at Pagsulat Tungo sa Mabisang Pagpapahayag
                </td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">3.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select
                    id="cs_fy1_ipp0010"
                    value={v_ipp0010}
                    onChange={(e) =>
                      change(
                        'cs_fy1_ipp0010',
                        'Interdisiplinaryong Pagbasa at Pagsulat Tungo sa Mabisang Pagpapahayag',
                        'IPP 0010',
                        3,
                        'First Year - 1st Semester',
                        e.target.value,
                        set_ipp0010
                      )
                    }
                    className={TABLE_STYLES.select}
                    disabled={isProcessing}
                  >
                    <option value="">--</option>
                    {SCALE.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>

              <tr>
                <td className="px-3 py-2 border-b border-gray-700">MMW 0001</td>
                <td className="px-3 py-2 border-b border-gray-700">Mathematics in the Modern World</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">3.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select
                    id="cs_fy1_mmw0001"
                    value={v_mmw0001}
                    onChange={(e) =>
                      change('cs_fy1_mmw0001', 'Mathematics in the Modern World', 'MMW 0001', 3, 'First Year - 1st Semester', e.target.value, set_mmw0001)
                    }
                    className={TABLE_STYLES.select}
                    disabled={isProcessing}
                  >
                    <option value="">--</option>
                    {SCALE.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>

              <tr>
                <td className="px-3 py-2 border-b border-gray-700">PED 0001</td>
                <td className="px-3 py-2 border-b border-gray-700">Foundation of Physical Activities</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">2.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select
                    id="cs_fy1_ped0001"
                    value={v_ped0001}
                    onChange={(e) =>
                      change('cs_fy1_ped0001', 'Foundation of Physical Activities', 'PED 0001', 2, 'First Year - 1st Semester', e.target.value, set_ped0001)
                    }
                    className={TABLE_STYLES.select}
                    disabled={isProcessing}
                  >
                    <option value="">--</option>
                    {SCALE.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>

              <tr>
                <td className="px-3 py-2 border-b border-gray-700">PCM 0006</td>
                <td className="px-3 py-2 border-b border-gray-700">Purposive Communication</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">3.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select
                    id="cs_fy1_pcm0006"
                    value={v_pcm0006}
                    onChange={(e) =>
                      change('cs_fy1_pcm0006', 'Purposive Communication', 'PCM 0006', 3, 'First Year - 1st Semester', e.target.value, set_pcm0006)
                    }
                    className={TABLE_STYLES.select}
                    disabled={isProcessing}
                  >
                    <option value="">--</option>
                    {SCALE.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>

              <tr>
                <td className="px-3 py-2 border-b border-gray-700">STS 0002</td>
                <td className="px-3 py-2 border-b border-gray-700">Science, Technology and Society</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">3.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select
                    id="cs_fy1_sts0002"
                    value={v_sts0002}
                    onChange={(e) =>
                      change('cs_fy1_sts0002', 'Science, Technology and Society', 'STS 0002', 3, 'First Year - 1st Semester', e.target.value, set_sts0002)
                    }
                    className={TABLE_STYLES.select}
                    disabled={isProcessing}
                  >
                    <option value="">--</option>
                    {SCALE.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>

              <tr>
                <td className="px-3 py-2 border-b border-gray-700">NSTP 01</td>
                <td className="px-3 py-2 border-b border-gray-700">National Service Training Program 1</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">3.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select
                    id="cs_fy1_nstp01"
                    value={v_nstp01}
                    onChange={(e) =>
                      change('cs_fy1_nstp01', 'National Service Training Program 1', 'NSTP 01', 3, 'First Year - 1st Semester', e.target.value, set_nstp01)
                    }
                    className={TABLE_STYLES.select}
                    disabled={isProcessing}
                  >
                    <option value="">--</option>
                    {SCALE.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>

      {/* First Year - 2nd Semester */}
      <details className={TABLE_STYLES.container(isDark)} open>
        <summary className={`${TABLE_STYLES.headerText(isDark)} cursor-pointer select-none`}>First Year - 2nd Semester</summary>
        <div className="overflow-x-auto">
          <table className={TABLE_STYLES.table}>
            <thead className={TABLE_STYLES.thead}>
              <tr>
                <th className={`${cellClass} w-24`}>Course No.</th>
                <th className={cellClass}>Descriptive Title</th>
                <th className={`${cellClass} text-right w-20`}>Units</th>
                <th className={`${cellClass} text-right w-28`}>Grade</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-3 py-2 border-b border-gray-700">CSC 0211</td>
                <td className="px-3 py-2 border-b border-gray-700">Discrete Structures 2</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">3.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select
                    id="cs_fy2_csc0211"
                    value={v_csc0211}
                    onChange={(e) =>
                      change('cs_fy2_csc0211', 'Discrete Structures 2', 'CSC 0211', 3, 'First Year - 2nd Semester', e.target.value, set_csc0211)
                    }
                    className={TABLE_STYLES.select}
                    disabled={isProcessing}
                  >
                    <option value="">--</option>
                    {SCALE.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>

              <tr>
                <td className="px-3 py-2 border-b border-gray-700">CSC 0223</td>
                <td className="px-3 py-2 border-b border-gray-700">Human Computer Interaction</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">3.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select
                    id="cs_fy2_csc0223"
                    value={v_csc0223}
                    onChange={(e) =>
                      change('cs_fy2_csc0223', 'Human Computer Interaction', 'CSC 0223', 3, 'First Year - 2nd Semester', e.target.value, set_csc0223)
                    }
                    className={TABLE_STYLES.select}
                    disabled={isProcessing}
                  >
                    <option value="">--</option>
                    {SCALE.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>

              <tr>
                <td className="px-3 py-2 border-b border-gray-700">ICC 0103</td>
                <td className="px-3 py-2 border-b border-gray-700">Intermediate Programming (Lecture)</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">2.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select
                    id="cs_fy2_icc0103"
                    value={v_icc0103}
                    onChange={(e) =>
                      change(
                        'cs_fy2_icc0103',
                        'Intermediate Programming (Lecture)',
                        'ICC 0103',
                        2,
                        'First Year - 2nd Semester',
                        e.target.value,
                        set_icc0103
                      )
                    }
                    className={TABLE_STYLES.select}
                    disabled={isProcessing}
                  >
                    <option value="">--</option>
                    {SCALE.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>

              <tr>
                <td className="px-3 py-2 border-b border-gray-700">ICC 0103.1</td>
                <td className="px-3 py-2 border-b border-gray-700">Intermediate Programming (Laboratory)</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">1.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select
                    id="cs_fy2_icc0103_1"
                    value={v_icc0103_1}
                    onChange={(e) =>
                      change(
                        'cs_fy2_icc0103_1',
                        'Intermediate Programming (Laboratory)',
                        'ICC 0103.1',
                        1,
                        'First Year - 2nd Semester',
                        e.target.value,
                        set_icc0103_1
                      )
                    }
                    className={TABLE_STYLES.select}
                    disabled={isProcessing}
                  >
                    <option value="">--</option>
                    {SCALE.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>

              <tr>
                <td className="px-3 py-2 border-b border-gray-700">ICC 0104</td>
                <td className="px-3 py-2 border-b border-gray-700">Data Structures and Algorithms (Lecture)</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">2.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select
                    id="cs_fy2_icc0104"
                    value={v_icc0104}
                    onChange={(e) =>
                      change(
                        'cs_fy2_icc0104',
                        'Data Structures and Algorithms (Lecture)',
                        'ICC 0104',
                        2,
                        'First Year - 2nd Semester',
                        e.target.value,
                        set_icc0104
                      )
                    }
                    className={TABLE_STYLES.select}
                    disabled={isProcessing}
                  >
                    <option value="">--</option>
                    {SCALE.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>

              <tr>
                <td className="px-3 py-2 border-b border-gray-700">ICC 0104.1</td>
                <td className="px-3 py-2 border-b border-gray-700">Data Structures and Algorithms (Laboratory)</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">1.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select
                    id="cs_fy2_icc0104_1"
                    value={v_icc0104_1}
                    onChange={(e) =>
                      change(
                        'cs_fy2_icc0104_1',
                        'Data Structures and Algorithms (Laboratory)',
                        'ICC 0104.1',
                        1,
                        'First Year - 2nd Semester',
                        e.target.value,
                        set_icc0104_1
                      )
                    }
                    className={TABLE_STYLES.select}
                    disabled={isProcessing}
                  >
                    <option value="">--</option>
                    {SCALE.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>

              <tr>
                <td className="px-3 py-2 border-b border-gray-700">LWR 0009</td>
                <td className="px-3 py-2 border-b border-gray-700">Life and Works of Rizal</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">3.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select
                    id="cs_fy2_lwr0009"
                    value={v_lwr0009}
                    onChange={(e) =>
                      change('cs_fy2_lwr0009', 'Life and Works of Rizal', 'LWR 0009', 3, 'First Year - 2nd Semester', e.target.value, set_lwr0009)
                    }
                    className={TABLE_STYLES.select}
                    disabled={isProcessing}
                  >
                    <option value="">--</option>
                    {SCALE.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>

              <tr>
                <td className="px-3 py-2 border-b border-gray-700">PED 0012</td>
                <td className="px-3 py-2 border-b border-gray-700">Group Exercise</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">2.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select
                    id="cs_fy2_ped0012"
                    value={v_ped0012}
                    onChange={(e) =>
                      change('cs_fy2_ped0012', 'Group Exercise', 'PED 0012', 2, 'First Year - 2nd Semester', e.target.value, set_ped0012)
                    }
                    className={TABLE_STYLES.select}
                    disabled={isProcessing}
                  >
                    <option value="">--</option>
                    {SCALE.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>

              <tr>
                <td className="px-3 py-2 border-b border-gray-700">RPH 0004</td>
                <td className="px-3 py-2 border-b border-gray-700">Readings in Philippine History</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">3.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select
                    id="cs_fy2_rph0004"
                    value={v_rph0004}
                    onChange={(e) =>
                      change('cs_fy2_rph0004', 'Readings in Philippine History', 'RPH 0004', 3, 'First Year - 2nd Semester', e.target.value, set_rph0004)
                    }
                    className={TABLE_STYLES.select}
                    disabled={isProcessing}
                  >
                    <option value="">--</option>
                    {SCALE.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>

              <tr>
                <td className="px-3 py-2 border-b border-gray-700">TCW 0005</td>
                <td className="px-3 py-2 border-b border-gray-700">The Contemporary World</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">3.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select
                    id="cs_fy2_tcw0005"
                    value={v_tcw0005}
                    onChange={(e) =>
                      change('cs_fy2_tcw0005', 'The Contemporary World', 'TCW 0005', 3, 'First Year - 2nd Semester', e.target.value, set_tcw0005)
                    }
                    className={TABLE_STYLES.select}
                    disabled={isProcessing}
                  >
                    <option value="">--</option>
                    {SCALE.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>

              <tr>
                <td className="px-3 py-2 border-b border-gray-700">NSTP 02</td>
                <td className="px-3 py-2 border-b border-gray-700">National Service Training Program 2</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">3.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select
                    id="cs_fy2_nstp02"
                    value={v_nstp02}
                    onChange={(e) =>
                      change('cs_fy2_nstp02', 'National Service Training Program 2', 'NSTP 02', 3, 'First Year - 2nd Semester', e.target.value, set_nstp02)
                    }
                    className={TABLE_STYLES.select}
                    disabled={isProcessing}
                  >
                    <option value="">--</option>
                    {SCALE.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>

      {/* First Year - 2nd Semester */}
      <details className={TABLE_STYLES.container(isDark)} open>
        <summary className={`${TABLE_STYLES.headerText(isDark)} cursor-pointer select-none`}>First Year - 2nd Semester</summary>
        <div className="overflow-x-auto">
          <table className={TABLE_STYLES.table}>
            <thead className={TABLE_STYLES.thead}>
              <tr>
                <th className={`${cellClass} w-24`}>Course No.</th>
                <th className={cellClass}>Descriptive Title</th>
                <th className={`${cellClass} text-right w-20`}>Units</th>
                <th className={`${cellClass} text-right w-28`}>Grade</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-3 py-2 border-b border-gray-700">CSC 0212</td>
                <td className="px-3 py-2 border-b border-gray-700">Object Oriented Programming (Lecture)</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">2.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select
                    id="cs_sy1_csc0212"
                    value={v_csc0212}
                    onChange={(e) =>
                      change('cs_sy1_csc0212', 'Object Oriented Programming (Lecture)', 'CSC 0212', 2, 'Second Year - 1st Semester', e.target.value, set_csc0212)
                    }
                    className={TABLE_STYLES.select}
                    disabled={isProcessing}
                  >
                    <option value="">--</option>
                    {SCALE.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>

              <tr>
                <td className="px-3 py-2 border-b border-gray-700">CSC 0212.1</td>
                <td className="px-3 py-2 border-b border-gray-700">Object Oriented Programming (Laboratory)</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">1.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select
                    id="cs_sy1_csc0212_1"
                    value={v_csc0212_1}
                    onChange={(e) =>
                      change(
                        'cs_sy1_csc0212_1',
                        'Object Oriented Programming (Laboratory)',
                        'CSC 0212.1',
                        1,
                        'Second Year - 1st Semester',
                        e.target.value,
                        set_csc0212_1
                      )
                    }
                    className={TABLE_STYLES.select}
                    disabled={isProcessing}
                  >
                    <option value="">--</option>
                    {SCALE.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>

              <tr>
                <td className="px-3 py-2 border-b border-gray-700">CSC 0213</td>
                <td className="px-3 py-2 border-b border-gray-700">Logic Design and Digital Computer Circuits (Lecture)</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">2.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select
                    id="cs_sy1_csc0213"
                    value={v_csc0213}
                    onChange={(e) =>
                      change(
                        'cs_sy1_csc0213',
                        'Logic Design and Digital Computer Circuits (Lecture)',
                        'CSC 0213',
                        2,
                        'Second Year - 1st Semester',
                        e.target.value,
                        set_csc0213
                      )
                    }
                    className={TABLE_STYLES.select}
                    disabled={isProcessing}
                  >
                    <option value="">--</option>
                    {SCALE.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>

              <tr>
                <td className="px-3 py-2 border-b border-gray-700">CSC 0213.1</td>
                <td className="px-3 py-2 border-b border-gray-700">Logic Design and Digital Computer Circuits (Laboratory)</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">1.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select
                    id="cs_sy1_csc0213_1"
                    value={v_csc0213_1}
                    onChange={(e) =>
                      change(
                        'cs_sy1_csc0213_1',
                        'Logic Design and Digital Computer Circuits (Laboratory)',
                        'CSC 0213.1',
                        1,
                        'Second Year - 1st Semester',
                        e.target.value,
                        set_csc0213_1
                      )
                    }
                    className={TABLE_STYLES.select}
                    disabled={isProcessing}
                  >
                    <option value="">--</option>
                    {SCALE.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>

              <tr>
                <td className="px-3 py-2 border-b border-gray-700">CSC 0224</td>
                <td className="px-3 py-2 border-b border-gray-700">Operation Research</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">3.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select
                    id="cs_sy1_csc0224"
                    value={v_csc0224}
                    onChange={(e) =>
                      change('cs_sy1_csc0224', 'Operation Research', 'CSC 0224', 3, 'Second Year - 1st Semester', e.target.value, set_csc0224)
                    }
                    className={TABLE_STYLES.select}
                    disabled={isProcessing}
                  >
                    <option value="">--</option>
                    {SCALE.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>

              <tr>
                <td className="px-3 py-2 border-b border-gray-700">ETH 0008</td>
                <td className="px-3 py-2 border-b border-gray-700">Ethics</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">3.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select
                    id="cs_sy1_eth0008"
                    value={v_eth0008}
                    onChange={(e) =>
                      change('cs_sy1_eth0008', 'Ethics', 'ETH 0008', 3, 'Second Year - 1st Semester', e.target.value, set_eth0008)
                    }
                    className={TABLE_STYLES.select}
                    disabled={isProcessing}
                  >
                    <option value="">--</option>
                    {SCALE.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>

              <tr>
                <td className="px-3 py-2 border-b border-gray-700">ICC 0105</td>
                <td className="px-3 py-2 border-b border-gray-700">Information Management (Lecture)</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">2.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select
                    id="cs_sy1_icc0105"
                    value={v_icc0105}
                    onChange={(e) =>
                      change('cs_sy1_icc0105', 'Information Management (Lecture)', 'ICC 0105', 2, 'Second Year - 1st Semester', e.target.value, set_icc0105)
                    }
                    className={TABLE_STYLES.select}
                    disabled={isProcessing}
                  >
                    <option value="">--</option>
                    {SCALE.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>

              <tr>
                <td className="px-3 py-2 border-b border-gray-700">ICC 0105.1</td>
                <td className="px-3 py-2 border-b border-gray-700">Information Management (Laboratory)</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">1.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select
                    id="cs_sy1_icc0105_1"
                    value={v_icc0105_1}
                    onChange={(e) =>
                      change(
                        'cs_sy1_icc0105_1',
                        'Information Management (Laboratory)',
                        'ICC 0105.1',
                        1,
                        'Second Year - 1st Semester',
                        e.target.value,
                        set_icc0105_1
                      )
                    }
                    className={TABLE_STYLES.select}
                    disabled={isProcessing}
                  >
                    <option value="">--</option>
                    {SCALE.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>

              <tr>
                <td className="px-3 py-2 border-b border-gray-700">ITE 0001</td>
                <td className="px-3 py-2 border-b border-gray-700">Living in the IT Era</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">3.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select
                    id="cs_sy1_ite0001"
                    value={v_ite0001}
                    onChange={(e) =>
                      change('cs_sy1_ite0001', 'Living in the IT Era', 'ITE 0001', 3, 'Second Year - 1st Semester', e.target.value, set_ite0001)
                    }
                    className={TABLE_STYLES.select}
                    disabled={isProcessing}
                  >
                    <option value="">--</option>
                    {SCALE.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>

              <tr>
                <td className="px-3 py-2 border-b border-gray-700">PED 0074</td>
                <td className="px-3 py-2 border-b border-gray-700">PE Elective</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">2.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select
                    id="cs_sy1_ped0074"
                    value={v_ped0074}
                    onChange={(e) =>
                      change('cs_sy1_ped0074', 'PE Elective', 'PED 0074', 2, 'Second Year - 1st Semester', e.target.value, set_ped0074)
                    }
                    className={TABLE_STYLES.select}
                    disabled={isProcessing}
                  >
                    <option value="">--</option>
                    {SCALE.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>

              <tr>
                <td className="px-3 py-2 border-b border-gray-700">UTS 0003</td>
                <td className="px-3 py-2 border-b border-gray-700">Understanding the Self</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">3.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select
                    id="cs_sy1_uts0003"
                    value={v_uts0003}
                    onChange={(e) =>
                      change('cs_sy1_uts0003', 'Understanding the Self', 'UTS 0003', 3, 'Second Year - 1st Semester', e.target.value, set_uts0003)
                    }
                    className={TABLE_STYLES.select}
                    disabled={isProcessing}
                  >
                    <option value="">--</option>
                    {SCALE.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>

      {/* Second Year - 2nd Semester */}
      <details className={TABLE_STYLES.container(isDark)} open>
        <summary className={`${TABLE_STYLES.headerText(isDark)} cursor-pointer select-none`}>Second Year - 2nd Semester</summary>
        <div className="overflow-x-auto">
          <table className={TABLE_STYLES.table}>
            <thead className={TABLE_STYLES.thead}>
              <tr>
                <th className={`${cellClass} w-24`}>Course No.</th>
                <th className={cellClass}>Descriptive Title</th>
                <th className={`${cellClass} text-right w-20`}>Units</th>
                <th className={`${cellClass} text-right w-28`}>Grade</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-3 py-2 border-b border-gray-700">CBM 0016</td>
                <td className="px-3 py-2 border-b border-gray-700">The Entrepreneurial Mind</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">3.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select
                    id="cs_sy2_cbm0016"
                    value={v_cbm0016}
                    onChange={(e) =>
                      change('cs_sy2_cbm0016', 'The Entrepreneurial Mind', 'CBM 0016', 3, 'Second Year - 2nd Semester', e.target.value, set_cbm0016)
                    }
                    className={TABLE_STYLES.select}
                    disabled={isProcessing}
                  >
                    <option value="">--</option>
                    {SCALE.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>

              <tr>
                <td className="px-3 py-2 border-b border-gray-700">CSC 0221</td>
                <td className="px-3 py-2 border-b border-gray-700">Algorithm and Complexity</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">3.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select
                    id="cs_sy2_csc0221"
                    value={v_csc0221}
                    onChange={(e) =>
                      change('cs_sy2_csc0221', 'Algorithm and Complexity', 'CSC 0221', 3, 'Second Year - 2nd Semester', e.target.value, set_csc0221)
                    }
                    className={TABLE_STYLES.select}
                    disabled={isProcessing}
                  >
                    <option value="">--</option>
                    {SCALE.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>

              <tr>
                <td className="px-3 py-2 border-b border-gray-700">CSC 0222</td>
                <td className="px-3 py-2 border-b border-gray-700">Architecture and Organization (Lecture)</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">2.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select
                    id="cs_sy2_csc0222"
                    value={v_csc0222}
                    onChange={(e) =>
                      change('cs_sy2_csc0222', 'Architecture and Organization (Lecture)', 'CSC 0222', 2, 'Second Year - 2nd Semester', e.target.value, set_csc0222)
                    }
                    className={TABLE_STYLES.select}
                    disabled={isProcessing}
                  >
                    <option value="">--</option>
                    {SCALE.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>

              <tr>
                <td className="px-3 py-2 border-b border-gray-700">CSC 0222.1</td>
                <td className="px-3 py-2 border-b border-gray-700">Architecture and Organization (Laboratory)</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">1.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select
                    id="cs_sy2_csc0222_1"
                    value={v_csc0222_1}
                    onChange={(e) =>
                      change(
                        'cs_sy2_csc0222_1',
                        'Architecture and Organization (Laboratory)',
                        'CSC 0222.1',
                        1,
                        'Second Year - 2nd Semester',
                        e.target.value,
                        set_csc0222_1
                      )
                    }
                    className={TABLE_STYLES.select}
                    disabled={isProcessing}
                  >
                    <option value="">--</option>
                    {SCALE.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>

              <tr>
                <td className="px-3 py-2 border-b border-gray-700">CSC 0316</td>
                <td className="px-3 py-2 border-b border-gray-700">Information Assurance Security</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">3.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select
                    id="cs_sy2_csc0316"
                    value={v_csc0316}
                    onChange={(e) =>
                      change('cs_sy2_csc0316', 'Information Assurance Security', 'CSC 0316', 3, 'Second Year - 2nd Semester', e.target.value, set_csc0316)
                    }
                    className={TABLE_STYLES.select}
                    disabled={isProcessing}
                  >
                    <option value="">--</option>
                    {SCALE.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>

              <tr>
                <td className="px-3 py-2 border-b border-gray-700">GES 0013</td>
                <td className="px-3 py-2 border-b border-gray-700">Environmental Science</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">3.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select
                    id="cs_sy2_ges0013"
                    value={v_ges0013}
                    onChange={(e) =>
                      change('cs_sy2_ges0013', 'Environmental Science', 'GES 0013', 3, 'Second Year - 2nd Semester', e.target.value, set_ges0013)
                    }
                    className={TABLE_STYLES.select}
                    disabled={isProcessing}
                  >
                    <option value="">--</option>
                    {SCALE.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>

              <tr>
                <td className="px-3 py-2 border-b border-gray-700">ICC 0106</td>
                <td className="px-3 py-2 border-b border-gray-700">Applications Development and Emerging Technologies (Lecture)</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">2.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select id="cs_sy2_icc0106" value={v_icc0106} onChange={(e) => change('cs_sy2_icc0106', 'Applications Development and Emerging Technologies (Lecture)', 'ICC 0106', 2, 'Second Year - 2nd Semester', e.target.value, set_icc0106)} className={TABLE_STYLES.select} disabled={isProcessing}>
                    <option value="">--</option>{SCALE.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>

              <tr>
                <td className="px-3 py-2 border-b border-gray-700">ICC 0106.1</td>
                <td className="px-3 py-2 border-b border-gray-700">Applications Development and Emerging Technologies (Laboratory)</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">3.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select id="cs_sy2_icc0106_1" value={v_icc0106_1} onChange={(e)=>change('cs_sy2_icc0106_1','Application Dev & Emerging Technologies (Laboratory)','ICC 0106.1',1,'Second Year - 2nd Semester',e.target.value,set_icc0106_1)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white w-28 font-mono tabular-nums text-right" disabled={isProcessing}>
                    <option value="">--</option>{SCALE.map(s=> <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 border-b border-gray-700">PED 0023</td>
                <td className="px-3 py-2 border-b border-gray-700">PE Elective</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">3.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select id="cs_sy2_ped0023" value={v_ped0023} onChange={(e)=>change('cs_sy2_ped0023','PE Elective 2','PED 0023',2,'Second Year - 2nd Semester',e.target.value,set_ped0023)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white w-28 font-mono tabular-nums text-right" disabled={isProcessing}>
                    <option value="">--</option>{SCALE.map(s=> <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 border-b border-gray-700">AAP 0007</td>
                <td className="px-3 py-2 border-b border-gray-700">Art Appreciation</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">3.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select
                    id="cs_sy2_aap0007"
                    value={v_aap0007}
                    onChange={(e) =>
                      change(
                        'cs_sy2_aap0007',
                        'Art Appreciation',
                        'AAP 0007',
                        3,
                        'Second Year - 2nd Semester',
                        e.target.value,
                        set_aap0007
                      )
                    }
                    className={TABLE_STYLES.select}
                    disabled={isProcessing}
                  >
                    <option value="">--</option>
                    {SCALE.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>

      {/* Third Year - 1st Semester */}
      <details className={TABLE_STYLES.container(isDark)} open>
        <summary className={`${TABLE_STYLES.headerText(isDark)} cursor-pointer select-none`}>Third Year - 1st Semester</summary>
        <div className="overflow-x-auto">
          <table className={TABLE_STYLES.table}>
            <thead className={TABLE_STYLES.thead}>
              <tr>
                <th className={`${cellClass} w-24`}>Course No.</th>
                <th className={cellClass}>Descriptive Title</th>
                <th className={`${cellClass} text-right w-20`}>Units</th>
                <th className={`${cellClass} text-right w-28`}>Grade</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-3 py-2 border-b border-gray-700">CSC 0311</td>
                <td className="px-3 py-2 border-b border-gray-700">Automata Theory and Formal Languages</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">3.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select id="cs_ty1_csc0311" value={v_csc0311} onChange={(e)=>change('cs_ty1_csc0311','CSC 0311 Automata Theory and Formal Languages (Lecture)','CSC 0311',3,'Third Year - 1st Semester',e.target.value,set_csc0311)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white w-28 font-mono tabular-nums text-right" disabled={isProcessing}>
                    <option value="">--</option>{SCALE.map(s=> <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 border-b border-gray-700">CSC 0312</td>
                <td className="px-3 py-2 border-b border-gray-700">Programming Languages (Lecture)</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">2.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select id="cs_ty1_csc0312" value={v_csc0312} onChange={(e)=>change('cs_ty1_csc0312','CSC 0312 Programming Languages (Lecture)','CSC 0312',2,'Third Year - 1st Semester',e.target.value,set_csc0312)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white w-28 font-mono tabular-nums text-right" disabled={isProcessing}>
                    <option value="">--</option>{SCALE.map(s=> <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 border-b border-gray-700">CSC 0312.1</td>
                <td className="px-3 py-2 border-b border-gray-700">Programming Languages (Laboratory)</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">1.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select id="cs_ty1_csc0312_1" value={v_csc0312_1} onChange={(e)=>change('cs_ty1_csc0312_1','CSC 0312.1 Programming Languages (Laboratory)','CSC 0312.1',1,'Third Year - 1st Semester',e.target.value,set_csc0312_1)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white w-28 font-mono tabular-nums text-right" disabled={isProcessing}>
                    <option value="">--</option>{SCALE.map(s=> <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 border-b border-gray-700">CSC 0313</td>
                <td className="px-3 py-2 border-b border-gray-700">Software Engineering (Lecture)</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">2.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select id="cs_ty1_csc0313" value={v_csc0313} onChange={(e)=>change('cs_ty1_csc0313','CSC 0313 Software Engineering (Lecture)','CSC 0313',2,'Third Year - 1st Semester',e.target.value,set_csc0313)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white w-28 font-mono tabular-nums text-right" disabled={isProcessing}>
                    <option value="">--</option>{SCALE.map(s=> <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 border-b border-gray-700">CSC 0313.1</td>
                <td className="px-3 py-2 border-b border-gray-700">Software Engineering (Laboratory)</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">1.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select id="cs_ty1_csc0313_1" value={v_csc0313_1} onChange={(e)=>change('cs_ty1_csc0313_1','CSC 0313.1 Software Engineering (Laboratory)','CSC 0313.1',1,'Third Year - 1st Semester',e.target.value,set_csc0313_1)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white w-28 font-mono tabular-nums text-right" disabled={isProcessing}>
                    <option value="">--</option>{SCALE.map(s=> <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 border-b border-gray-700">CSC 0314</td>
                <td className="px-3 py-2 border-b border-gray-700">Operating System (Lecture)</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">2.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select id="cs_ty1_csc0314" value={v_csc0314} onChange={(e)=>change('cs_ty1_csc0314','CSC 0314 Operating System (Lecture)','CSC 0314',2,'Third Year - 1st Semester',e.target.value,set_csc0314)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white w-28 font-mono tabular-nums text-right" disabled={isProcessing}>
                    <option value="">--</option>{SCALE.map(s=> <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 border-b border-gray-700">CSC 0314.1</td>
                <td className="px-3 py-2 border-b border-gray-700">Operating System (Laboratory)</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">1.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select id="cs_ty1_csc0314_1" value={v_csc0314_1} onChange={(e)=>change('cs_ty1_csc0314_1','CSC 0314.1 Operating System (Laboratory)','CSC 0314.1',1,'Third Year - 1st Semester',e.target.value,set_csc0314_1)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white w-28 font-mono tabular-nums text-right" disabled={isProcessing}>
                    <option value="">--</option>{SCALE.map(s=> <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 border-b border-gray-700">CSC 0315</td>
                <td className="px-3 py-2 border-b border-gray-700">Intelligent System (Lecture)</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">2.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select id="cs_ty1_csc0315" value={v_csc0315} onChange={(e)=>change('cs_ty1_csc0315','CSC 0315 Intelligent System (Lecture)','CSC 0315',2,'Third Year - 1st Semester',e.target.value,set_csc0315)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white w-28 font-mono tabular-nums text-right" disabled={isProcessing}>
                    <option value="">--</option>{SCALE.map(s=> <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 border-b border-gray-700">CSC 0315.1</td>
                <td className="px-3 py-2 border-b border-gray-700">Intelligent System (Laboratory)</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">1.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select id="cs_ty1_csc0315_1" value={v_csc0315_1} onChange={(e)=>change('cs_ty1_csc0315_1','CSC 0315.1 Intelligent System (Laboratory)','CSC 0315.1',1,'Third Year - 1st Semester',e.target.value,set_csc0315_1)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white w-28 font-mono tabular-nums text-right" disabled={isProcessing}>
                    <option value="">--</option>{SCALE.map(s=> <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>

      {/* Third Year - 2nd Semester */}
      <details className={TABLE_STYLES.container(isDark)} open>
        <summary className={`${TABLE_STYLES.headerText(isDark)} cursor-pointer select-none`}>Third Year - 2nd Semester</summary>
        <div className="overflow-x-auto">
<table className={TABLE_STYLES.table}>
            <thead className={TABLE_STYLES.thead}>
              <tr>
                <th className={`${cellClass} w-24`}>Course No.</th>
                <th className={cellClass}>Descriptive Title</th>
                <th className={`${cellClass} text-right w-20`}>Units</th>
                <th className={`${cellClass} text-right w-28`}>Grade</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-3 py-2 border-b border-gray-700">CSC 0321</td>
                <td className="px-3 py-2 border-b border-gray-700">Software Engineering 2 (Lecture)</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">2.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select id="cs_ty2_csc0321" value={v_csc0321} onChange={(e)=>change('cs_ty2_csc0321','CSC 0321 Software Engineering 2 (Lecture)','CSC 0321',2,'Third Year - 2nd Semester',e.target.value,set_csc0321)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white w-28 font-mono tabular-nums text-right" disabled={isProcessing}>
                    <option value="">--</option>{SCALE.map(s=> <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 border-b border-gray-700">CSC 0321.1</td>
                <td className="px-3 py-2 border-b border-gray-700">Software Engineering 2 (Laboratory)</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">1.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                <select id="cs_ty2_csc0321_1" value={v_csc0321_1} onChange={(e)=>change('cs_ty2_csc0321_1','CSC 0321.1 Software Engineering 2 (Laboratory)','CSC 0321.1',1,'Third Year - 2nd Semester',e.target.value,set_csc0321_1)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white w-28 font-mono tabular-nums text-right" disabled={isProcessing}>
                    <option value="">--</option>{SCALE.map(s=> <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 border-b border-gray-700">CSC 0322</td>
                <td className="px-3 py-2 border-b border-gray-700">Compiler Design (Lecture)</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">2.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select id="cs_ty2_csc0322" value={v_csc0322} onChange={(e)=>change('cs_ty2_csc0322','CSC 0322 Compiler Design (Lecture)','CSC 0322',2,'Third Year - 2nd Semester',e.target.value,set_csc0322)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white w-28 font-mono tabular-nums text-right" disabled={isProcessing}>
                    <option value="">--</option>{SCALE.map(s=> <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 border-b border-gray-700">CSC 0322.1</td>
                <td className="px-3 py-2 border-b border-gray-700">Compiler Design (Laboratory)</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">1.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select id="cs_ty2_csc0322_1" value={v_csc0322_1} onChange={(e)=>change('cs_ty2_csc0322_1','CSC 0322.1 Compiler Design (Laboratory)','CSC 0322.1',1,'Third Year - 2nd Semester',e.target.value,set_csc0322_1)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white w-28 font-mono tabular-nums text-right" disabled={isProcessing}>
                    <option value="">--</option>{SCALE.map(s=> <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 border-b border-gray-700">CSC 0323</td>
                <td className="px-3 py-2 border-b border-gray-700">Computational Science (Lecture)</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">2.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select id="cs_ty2_csc0323" value={v_csc0323} onChange={(e)=>change('cs_ty2_csc0323','CSC 0323 Computational Science (Lecture)','CSC 0323',2,'Third Year - 2nd Semester',e.target.value,set_csc0323)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white w-28 font-mono tabular-nums text-right" disabled={isProcessing}>
                    <option value="">--</option>{SCALE.map(s=> <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 border-b border-gray-700">CSC 0323.1</td>
                <td className="px-3 py-2 border-b border-gray-700">Computational Science (Laboratory)</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">1.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select id="cs_ty2_csc0323_1" value={v_csc0323_1} onChange={(e)=>change('cs_ty2_csc0323_1','CSC 0323.1 Computational Science (Laboratory)','CSC 0323.1',1,'Third Year - 2nd Semester',e.target.value,set_csc0323_1)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white w-28 font-mono tabular-nums text-right" disabled={isProcessing}>
                    <option value="">--</option>{SCALE.map(s=> <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 border-b border-gray-700">CSC 0324</td>
                <td className="px-3 py-2 border-b border-gray-700">CS Elective 1  (Lecture)</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">2.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select id="cs_ty2_csc0324" value={v_csc0324} onChange={(e)=>change('cs_ty2_csc0324','CSC 0324 CS Elective 1 (Lecture)','CSC 0324',2,'Third Year - 2nd Semester',e.target.value,set_csc0324)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white w-28 font-mono tabular-nums text-right" disabled={isProcessing}>
                    <option value="">--</option>{SCALE.map(s=> <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 border-b border-gray-700">CSC 0324.1</td>
                <td className="px-3 py-2 border-b border-gray-700">CS Elective 1 (Laboratory)</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">1.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select id="cs_ty2_csc0324_1" value={v_csc0324_1} onChange={(e)=>change('cs_ty2_csc0324_1','CSC 0324.1 CS Elective 1 (Laboratory)','CSC 0324.1',1,'Third Year - 2nd Semester',e.target.value,set_csc0324_1)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white w-28 font-mono tabular-nums text-right" disabled={isProcessing}>
                    <option value="">--</option>{SCALE.map(s=> <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 border-b border-gray-700">CSC 0325</td>
                <td className="px-3 py-2 border-b border-gray-700">Research Writing</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">3.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select id="cs_ty2_csc0325" value={v_csc0325} onChange={(e)=>change('cs_ty2_csc0325','CSC 0325 Research Writing','CSC 0325',3,'Third Year - 2nd Semester',e.target.value,set_csc0325)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white w-28 font-mono tabular-nums text-right" disabled={isProcessing}>
                    <option value="">--</option>{SCALE.map(s=> <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>

      {/* Third Year - Summer */}
      <details className={TABLE_STYLES.container(isDark)} open>
        <summary className={`${TABLE_STYLES.headerText(isDark)} cursor-pointer select-none`}>Third Year - Summer</summary>
        <div className="overflow-x-auto">
<table className={TABLE_STYLES.table}>
            <thead className={TABLE_STYLES.thead}>
              <tr>
                <th className={`${cellClass} w-24`}>Course No.</th>
                <th className={cellClass}>Descriptive Title</th>
                <th className={`${cellClass} text-right w-20`}>Units</th>
                <th className={`${cellClass} text-right w-28`}>Grade</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-3 py-2 border-b border-gray-700">CSC 195</td>
                <td className="px-3 py-2 border-b border-gray-700">Practicum (240 hrs)</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">3.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select id="cs_ty_csc195_1" value={v_csc195_1} onChange={(e)=>change('cs_ty_csc195_1','CSC 195.1 Practicum (240 hrs)','CSC 195.1',2,'Third Year - Midyear/Summer Term',e.target.value,set_csc195_1)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white w-28 font-mono tabular-nums text-right" disabled={isProcessing}>
                    <option value="">--</option>{SCALE.map(s=> <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>

      {/* Fourth Year - 1st Semester */}
      <details className={TABLE_STYLES.container(isDark)} open>
        <summary className={`${TABLE_STYLES.headerText(isDark)} cursor-pointer select-none`}>Fourth Year - 1st Semester</summary>
          <div className="overflow-x-auto">
            <table className={TABLE_STYLES.table}>
              <thead className={TABLE_STYLES.thead}>
                <tr>
                  <th className={`${cellClass} w-24`}>Course No.</th>
                  <th className={cellClass}>Descriptive Title</th>
                  <th className={`${cellClass} text-right w-20`}>Units</th>
                  <th className={`${cellClass} text-right w-28`}>Grade</th>
                </tr>
              </thead>
              <tbody>
              <tr>
                <td className="px-3 py-2 border-b border-gray-700">CSC 0411</td>
                <td className="px-3 py-2 border-b border-gray-700">CS Thesis Writing 1</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">3.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select id="cs_fy4_csc0411" value={v_csc0411} onChange={(e)=>change('cs_fy4_csc0411','CSC 0411 CS Thesis Writing 1','CSC 0411',3,'Fourth Year - 1st Semester',e.target.value,set_csc0411)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white w-28 font-mono tabular-nums text-right" disabled={isProcessing}>
                    <option value="">--</option>{SCALE.map(s=> <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
              <tr>
                <td className="px-3 py-2 border-b border-gray-700">CSC 0412</td>
                <td className="px-3 py-2 border-b border-gray-700">Networks and Communication (Lecture)</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">2.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select id="cs_fy4_csc0412" value={v_csc0412} onChange={(e)=>change('cs_fy4_csc0412','CSC 0412 Networks and Communications (Lecture)','CSC 0412',2,'Fourth Year - 1st Semester',e.target.value,set_csc0412)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white w-28 font-mono tabular-nums text-right" disabled={isProcessing}>
                    <option value="">--</option>{SCALE.map(s=> <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 border-b border-gray-700">CSC 0412.1</td>
                <td className="px-3 py-2 border-b border-gray-700">Networks and Communication (Laboratory)</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">1.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select id="cs_fy4_csc0412_1" value={v_csc0412_1} onChange={(e)=>change('cs_fy4_csc0412_1','CSC 0412.1 Networks and Communications (Laboratory)','CSC 0412.1',1,'Fourth Year - 1st Semester',e.target.value,set_csc0412_1)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white w-28 font-mono tabular-nums text-right" disabled={isProcessing}>
                    <option value="">--</option>{SCALE.map(s=> <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 border-b border-gray-700">CSC 0413</td>
                <td className="px-3 py-2 border-b border-gray-700">CS Elective 2 (Lecture)</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">2.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select id="cs_fy4_csc0413" value={v_csc0413} onChange={(e)=>change('cs_fy4_csc0413','CSC 0413 CS Elective 2 (Lecture)','CSC 0413',2,'Fourth Year - 1st Semester',e.target.value,set_csc0413)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white w-28 font-mono tabular-nums text-right" disabled={isProcessing}>
                    <option value="">--</option>{SCALE.map(s=> <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 border-b border-gray-700">CSC 0413.1</td>
                <td className="px-3 py-2 border-b border-gray-700">CS Elective 2 (Laboratory)</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">1.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select id="cs_fy4_csc0413_1" value={v_csc0413_1} onChange={(e)=>change('cs_fy4_csc0413_1','CSC 0413.1 CS Elective 2 (Laboratory)','CSC 0413.1',1,'Fourth Year - 1st Semester',e.target.value,set_csc0413_1)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white w-28 font-mono tabular-nums text-right" disabled={isProcessing}>
                    <option value="">--</option>{SCALE.map(s=> <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 border-b border-gray-700">CSC 0414</td>
                <td className="px-3 py-2 border-b border-gray-700">CS Elective 3 (Lecture)</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">2.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select id="cs_fy4_csc0414" value={v_csc0414} onChange={(e)=>change('cs_fy4_csc0414','CSC 0414 CS Elective 3 (Lecture)','CSC 0414',2,'Fourth Year - 1st Semester',e.target.value,set_csc0414)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white w-28 font-mono tabular-nums text-right" disabled={isProcessing}>
                    <option value="">--</option>{SCALE.map(s=> <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 border-b border-gray-700">CSC 0414.1</td>
                <td className="px-3 py-2 border-b border-gray-700">CS Elective 3 (Laboratory)</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">1.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select id="cs_fy4_csc0414_1" value={v_csc0414_1} onChange={(e)=>change('cs_fy4_csc0414_1','CSC 0414.1 CS Elective 3 (Laboratory)','CSC 0414.1',1,'Fourth Year - 1st Semester',e.target.value,set_csc0414_1)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white w-28 font-mono tabular-nums text-right" disabled={isProcessing}>
                    <option value="">--</option>{SCALE.map(s=> <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>

      {/* Fourth Year - 2nd Semester */}
      <details className={TABLE_STYLES.container(isDark)} open>
        <summary className={`${TABLE_STYLES.headerText(isDark)} cursor-pointer select-none`}>Fourth Year - 2nd Semester</summary>
        <div className="overflow-x-auto">
          <table className={TABLE_STYLES.table}>
            <thead className={TABLE_STYLES.thead}>
              <tr>
                <th className={`${cellClass} w-24`}>Course No.</th>
                <th className={cellClass}>Descriptive Title</th>
                <th className={`${cellClass} text-right w-20`}>Units</th>
                <th className={`${cellClass} text-right w-28`}>Grade</th>
                </tr>
              </thead>
              <tbody>
              <tr>
                <td className="px-3 py-2 border-b border-gray-700">CSC 0421A</td>
                <td className="px-3 py-2 border-b border-gray-700">CS Thesis Writing 2</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">3.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select id="cs_fy4b_csc0421a" value={v_csc0421a} onChange={(e)=>change('cs_fy4b_csc0421a','CSC 0421A CS Thesis Writing 2','CSC 0421A',3,'Fourth Year - 2nd Semester',e.target.value,set_csc0421a)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white w-28 font-mono tabular-nums text-right" disabled={isProcessing}>
                    <option value="">--</option>{SCALE.map(s=> <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 border-b border-gray-700">CSC 0422</td>
                <td className="px-3 py-2 border-b border-gray-700">Parallel and Distributing Computing (Lecture)</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">2.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select id="cs_fy4b_csc0422" value={v_csc0422} onChange={(e)=>change('cs_fy4b_csc0422','CSC 0422 Parallel and Distributed Computing (Lecture)','CSC 0422',2,'Fourth Year - 2nd Semester',e.target.value,set_csc0422)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white w-28 font-mono tabular-nums text-right" disabled={isProcessing}>
                    <option value="">--</option>{SCALE.map(s=> <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 border-b border-gray-700">CSC 0422.1</td>
                <td className="px-3 py-2 border-b border-gray-700">Parallel and Distributing Computing (Laboratory)</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">1.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select id="cs_fy4b_csc0422_1" value={v_csc0422_1} onChange={(e)=>change('cs_fy4b_csc0422_1','CSC 0422.1 Parallel and Distributed Computing (Laboratory)','CSC 0422.1',1,'Fourth Year - 2nd Semester',e.target.value,set_csc0422_1)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white w-28 font-mono tabular-nums text-right" disabled={isProcessing}>
                    <option value="">--</option>{SCALE.map(s=> <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 border-b border-gray-700">CSC 0423</td>
                <td className="px-3 py-2 border-b border-gray-700">Social Issues and Professional Practice</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">3.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select id="cs_fy4b_csc0423" value={v_csc0423} onChange={(e)=>change('cs_fy4b_csc0423','CSC 0423 Social Issues and Professional Practice (Lecture)','CSC 0423',2,'Fourth Year - 2nd Semester',e.target.value,set_csc0423)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white w-28 font-mono tabular-nums text-right" disabled={isProcessing}>
                    <option value="">--</option>{SCALE.map(s=> <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 border-b border-gray-700">CSC 0423.1</td>
                <td className="px-3 py-2 border-b border-gray-700">Graphics and Visual Computing (Lecture)</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">2.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select id="cs_fy4b_csc0424" value={v_csc0424} onChange={(e)=>change('cs_fy4b_csc0424','CSC 0424 Graphics and Visual Computing (Lecture)','CSC 0424',2,'Fourth Year - 2nd Semester',e.target.value,set_csc0424)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white w-28 font-mono tabular-nums text-right" disabled={isProcessing}>
                    <option value="">--</option>{SCALE.map(s=> <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                </tr>
              <tr>
                <td className="px-3 py-2 border-b border-gray-700">CSC 0424.1</td>
                <td className="px-3 py-2 border-b border-gray-700">Graphics and Visual Computing (Laboratory)</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">1.00</td>
                <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                  <select id="cs_fy4b_csc0424_1" value={v_csc0424_1} onChange={(e)=>change('cs_fy4b_csc0424_1','CSC 0424.1 Graphics and Visual Computing (Laboratory)','CSC 0424.1',1,'Fourth Year - 2nd Semester',e.target.value,set_csc0424_1)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white w-28 font-mono tabular-nums text-right" disabled={isProcessing}>
                    <option value="">--</option>{SCALE.map(s=> <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                </tr>
              </tbody>
            </table>
          </div>
        </details>
    </div>
  );
};

export default CStaticTable;