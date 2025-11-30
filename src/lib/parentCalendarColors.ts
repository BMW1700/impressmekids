// Utility to assign consistent colors to students in parent calendar
export const STUDENT_COLORS = [
  { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-900 dark:text-blue-100", border: "border-blue-300 dark:border-blue-700" },
  { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-900 dark:text-purple-100", border: "border-purple-300 dark:border-purple-700" },
  { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-900 dark:text-green-100", border: "border-green-300 dark:border-green-700" },
  { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-900 dark:text-orange-100", border: "border-orange-300 dark:border-orange-700" },
  { bg: "bg-pink-100 dark:bg-pink-900/30", text: "text-pink-900 dark:text-pink-100", border: "border-pink-300 dark:border-pink-700" },
  { bg: "bg-teal-100 dark:bg-teal-900/30", text: "text-teal-900 dark:text-teal-100", border: "border-teal-300 dark:border-teal-700" },
];

export const PARENT_COLOR = {
  bg: "bg-indigo-100 dark:bg-indigo-900/30",
  text: "text-indigo-900 dark:text-indigo-100",
  border: "border-indigo-300 dark:border-indigo-700"
};

export function getStudentColor(studentIndex: number) {
  return STUDENT_COLORS[studentIndex % STUDENT_COLORS.length];
}

export function getParentColor() {
  return PARENT_COLOR;
}
