export const formatHours = (hours: number | string | undefined | null): string => {
  if (hours === undefined || hours === null || isNaN(Number(hours))) return '0h';
  const num = Number(hours);
  if (num === 0) return '0h';
  
  if (num > 0 && num < 1) {
    const mins = Math.round(num * 60);
    return `${mins}m`;
  }
  
  if (Number.isInteger(num)) {
    return `${num}h`;
  }
  
  // Strip trailing zeros for decimals
  return `${Number(num.toFixed(2))}h`;
};
