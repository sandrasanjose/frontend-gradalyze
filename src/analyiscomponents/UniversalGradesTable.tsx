import { useMemo } from 'react';
import type { GradeRow } from '../services/gradesService';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
  grades: GradeRow[];
  onGradesChange: (grades: GradeRow[]) => void;
  isProcessing: boolean;
}

// Standard Grade Scale for dropdowns
const SCALE = ['1.00', '1.25', '1.50', '1.75', '2.00', '2.25', '2.50', '2.75', '3.00', '5.00'];

// Reusing your existing design styles exactly as they were
const TABLE_STYLES = {
  table: "min-w-full text-sm text-left border border-gray-700 rounded-md divide-y divide-gray-700",
  thead: "bg-gray-900 text-gray-300",
  cell: (isDark: boolean) => `px-3 py-2 border-b border-gray-700 ${
    isDark ? 'text-white bg-[#1e2939]' : 'text-gray-900 bg-[#938872]'
  }`,
  row: (isDark: boolean, isAlternate: boolean) => isAlternate ? (
    isDark ? 'bg-[#2a2f38]' : 'bg-[#f5f6f7]'
  ) : (
    isDark ? 'bg-[#463f3f]' : 'bg-[#e7e2d8]'
  ),
  select: "bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white w-28 font-mono tabular-nums text-right",
  container: (isDark: boolean) => `rounded-lg border p-4 transition-colors ${
    isDark
      ? 'bg-gradient-to-br from-gray-800/50 to-gray-700/50 border-gray-600/50' 
      : 'bg-gradient-to-br from-gray-100/50 to-gray-200/50 border-gray-300/50'
  }`,
  headerText: (isDark: boolean) => `text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`
};

const UniversalGradesTable = ({ grades, onGradesChange, isProcessing }: Props) => {
  const { isDark } = useTheme();

  // 1. Dynamically group the flat list of grades by their 'semester' field
  const groupedGrades = useMemo(() => {
    const groups: Record<string, GradeRow[]> = {};
    
    grades.forEach((grade) => {
      // Default to 'Detected Subjects' if semester is missing from OCR
      const sem = grade.semester || 'Detected Subjects';
      if (!groups[sem]) {
        groups[sem] = [];
      }
      groups[sem].push(grade);
    });

    return groups;
  }, [grades]);

  // 2. Handler to update a specific grade in the master list
  const handleGradeChange = (id: string, newValue: string) => {
    const numValue = parseFloat(newValue);
    if (isNaN(numValue)) return;

    const updatedGrades = grades.map((g) => 
      g.id === id ? { ...g, grade: numValue } : g
    );
    onGradesChange(updatedGrades);
  };

  return (
    <div className={`space-y-6 ${
      isDark
        ? '[&_select]:!bg-gray-800 [&_select]:!text-white [&_select]:!border-gray-700'
        : '[&_select]:!bg-white [&_select]:!text-gray-900 [&_select]:!border-gray-300'
    }`}>
      
      {/* 3. Iterate through identified semesters (Dynamic Rendering) */}
      {Object.keys(groupedGrades).length > 0 ? (
        Object.entries(groupedGrades).map(([semester, subjectList]) => (
          <details key={semester} className={TABLE_STYLES.container(isDark)} open>
            <summary className={`${TABLE_STYLES.headerText(isDark)} cursor-pointer select-none`}>
              {semester}
            </summary>
            <div className="overflow-x-auto">
              <table className={TABLE_STYLES.table}>
                <thead className={TABLE_STYLES.thead}>
                  <tr>
                    <th className={`${TABLE_STYLES.cell(isDark)} w-24`}>Course No.</th>
                    <th className={TABLE_STYLES.cell(isDark)}>Descriptive Title</th>
                    <th className={`${TABLE_STYLES.cell(isDark)} text-right w-20`}>Units</th>
                    <th className={`${TABLE_STYLES.cell(isDark)} text-right w-28`}>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {subjectList.map((subject, idx) => (
                    <tr key={subject.id || `${semester}-${idx}`} className={TABLE_STYLES.row(isDark, idx % 2 !== 0)}>
                      {/* Course Code */}
                      <td className="px-3 py-2 border-b border-gray-700 font-mono text-xs">
                        {subject.courseCode || '---'}
                      </td>
                      
                      {/* Subject Title */}
                      <td className="px-3 py-2 border-b border-gray-700">
                        {subject.subject}
                      </td>
                      
                      {/* Units */}
                      <td className="px-3 py-2 border-b border-gray-700 text-right">
                        {subject.units.toFixed(2)}
                      </td>
                      
                      {/* Grade Dropdown (Editable) */}
                      <td className="px-3 py-2 border-b border-gray-700 text-right min-w-[7rem]">
                        <select 
                          aria-label={`Grade for ${subject.subject}`}
                          value={subject.grade ? subject.grade.toFixed(2) : ''} 
                          onChange={(e) => handleGradeChange(subject.id, e.target.value)}
                          className={TABLE_STYLES.select} 
                          disabled={isProcessing}
                        >
                          <option value="">--</option>
                          {SCALE.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        ))
      ) : (
        // Empty State
        <div className={`text-center p-8 border rounded-lg border-dashed ${isDark ? 'border-gray-700 text-gray-400' : 'border-gray-300 text-gray-500'}`}>
          <p>No subjects loaded. Please upload a Transcript of Records.</p>
        </div>
      )}
    </div>
  );
};

export default UniversalGradesTable;