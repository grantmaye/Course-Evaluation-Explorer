export const institutions = [
  { id: 1, name: 'Northstar College', city: 'Charlotte, NC' },
  { id: 2, name: 'Summit University', city: 'Denver, CO' },
  { id: 3, name: 'Pacific Institute', city: 'Sacramento, CA' },
];
export const courses = [
  { id: 101, name: 'Introduction to Computer Science', code: 'CS 101 · Section A' },
  { id: 102, name: 'Database Systems', code: 'CS 240 · Section A' },
  { id: 103, name: 'Web Application Development', code: 'CS 310 · Section B' },
  { id: 104, name: 'Software Engineering', code: 'CS 350 · Section A' },
  { id: 105, name: 'Applied Mathematics', code: 'MATH 210 · Section C' },
  { id: 106, name: 'Technical Communication', code: 'ENG 220 · Section B' },
];

// Repeatable, fictional submissions: one overall rating per row, no student data.
export function makeResponses(count = 60000) {
  let state = 8417;
  const random = () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296);
  const start = Date.UTC(2023, 0, 1);
  return Array.from({ length: count }, (_, i) => ({
    responseId: i + 1,
    institutionId: 1 + Math.floor(random() * 3),
    courseOfferingId: 101 + Math.floor(random() * 6),
    submittedAt: new Date(start + Math.floor(random() * 1461 * 86400000)).toISOString(),
    rating: [2, 3, 3, 4, 4, 4, 5, 5][Math.floor(random() * 8)],
  }));
}
