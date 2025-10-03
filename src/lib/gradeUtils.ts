/**
 * Utility functions for handling K-12 grade levels
 * Grade 0 = Kindergarten, Grades 1-12 = "1" through "12"
 */

export const SUBJECTS = [
  'Math',
  'Science',
  'English',
  'History',
  'Geography',
  'Art',
  'Music',
  'Physical Education',
  'Computer Science',
  'Foreign Language',
  'Other'
];

export const GRADES_K12 = [
  { value: 0, label: 'Kindergarten', short: 'K' },
  { value: 1, label: 'Grade 1', short: '1' },
  { value: 2, label: 'Grade 2', short: '2' },
  { value: 3, label: 'Grade 3', short: '3' },
  { value: 4, label: 'Grade 4', short: '4' },
  { value: 5, label: 'Grade 5', short: '5' },
  { value: 6, label: 'Grade 6', short: '6' },
  { value: 7, label: 'Grade 7', short: '7' },
  { value: 8, label: 'Grade 8', short: '8' },
  { value: 9, label: 'Grade 9', short: '9' },
  { value: 10, label: 'Grade 10', short: '10' },
  { value: 11, label: 'Grade 11', short: '11' },
  { value: 12, label: 'Grade 12', short: '12' },
];

export const GRADES = GRADES_K12;

export const getGradeDisplay = (grade: number): string => {
  if (grade === 0) return 'K';
  return grade.toString();
};

export const getGradeLabel = (grade: number): string => {
  const gradeInfo = GRADES_K12.find(g => g.value === grade);
  return gradeInfo?.label || `Grade ${grade}`;
};

export const getGradeRangeDisplay = (minGrade: number, maxGrade: number): string => {
  const min = getGradeDisplay(minGrade);
  const max = getGradeDisplay(maxGrade);
  return `Grades ${min}-${max}`;
};
