export const parseLocalDateString = (dateStr?: string | Date | null): Date | null => {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return isNaN(dateStr.getTime()) ? null : dateStr;
  const str = String(dateStr);
  const parts = str.split('T')[0].split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day, 12, 0, 0);
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
};

export const formatLocalDateString = (date: Date | null): string => {
  if (!date || isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}T12:00:00.000Z`;
};

export const formatDateDisplay = (dateStr?: string | Date | null): string => {
  if (!dateStr) return '-';
  const d = parseLocalDateString(dateStr);
  if (!d) return '-';
  const day = String(d.getDate()).padStart(2, '0');
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthStr = monthNames[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${monthStr}, ${year}`;
};
