export const normalizeDept = (dept?: string): string[] => {
  if (!dept) return [];
  const lower = dept.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (lower.includes('full')) return ['fullstack', 'full_stack', 'full stack'];
  if (lower.includes('shop')) return ['shopify'];
  if (lower.includes('word')) return ['wordpress'];
  if (lower.includes('seo')) return ['seo'];
  if (lower.includes('design') || lower.includes('ui') || lower.includes('ux')) return ['design', 'ui_ux', 'ui/ux'];
  if (lower.includes('sales')) return ['sales'];
  return [dept.toLowerCase()];
};
