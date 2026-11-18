const dateFmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
const timeFmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' });

export const formatDate = (value) => (value ? dateFmt.format(new Date(value)) : '—');
export const formatDateTime = (value) => (value ? dateTimeFmt.format(new Date(value)) : '—');

export const relativeTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  if (date.toDateString() === today.toDateString()) return `Today, ${timeFmt.format(date)}`;
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday, ${timeFmt.format(date)}`;
  return formatDateTime(value);
};

export const ageFrom = (dob) => {
  if (!dob) return null;
  const d = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age -= 1;
  return age;
};

export const initials = (name = '') =>
  name
    .replace(/^Demo Patient – /, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

export const formatBytes = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

export const GENDER_LABELS = { female: 'Female', male: 'Male', other: 'Other', prefer_not_to_say: 'Prefer not to say', '': '—' };

export const QUESTION_TYPE_LABELS = {
  yes_no: 'Yes / No',
  single_choice: 'Single choice',
  multiple_choice: 'Multiple choice',
  rating_scale: 'Rating scale',
  frequency_scale: 'Frequency scale',
  percentage_scale: 'Percentage scale',
  text: 'Text response',
};

export const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');

/** "26 yrs, Male" style summary using date of birth when known, otherwise the self-reported age. */
export const ageGender = (p) => {
  const age = p.dateOfBirth ? ageFrom(p.dateOfBirth) : p.age;
  const gender = p.gender ? GENDER_LABELS[p.gender] : null;
  if (age === null || age === undefined) return gender ? `Age not given, ${gender}` : 'Age not given';
  return gender ? `${age} yrs, ${gender}` : `${age} yrs`;
};
