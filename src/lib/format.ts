export function formatPrice(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null) return '$ 0';
  
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numericAmount)) return '$ 0';

  return `$ ${new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numericAmount)}`;
}
