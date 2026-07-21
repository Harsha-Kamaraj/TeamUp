/**
 * Profile option labels — kept in sync with the backend User model enums.
 */
export const YEAR_OPTIONS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  '5th Year',
  'Graduate',
  'Alumni',
];

export const AVAILABILITY = {
  available: { label: 'Available', variant: 'green' },
  limited: { label: 'Limited availability', variant: 'amber' },
  unavailable: { label: 'Not available', variant: 'slate' },
};

export const WORK_MODE = {
  remote: 'Remote',
  offline: 'In-person',
  hybrid: 'Hybrid',
  any: 'Any',
};

// For the work-mode <Select>.
export const WORK_MODE_OPTIONS = Object.entries(WORK_MODE).map(([value, label]) => ({
  value,
  label,
}));

export const AVAILABILITY_OPTIONS = Object.entries(AVAILABILITY).map(([value, { label }]) => ({
  value,
  label,
}));
