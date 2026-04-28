export const formatCurrencyVnd = (value: number): string => {
  return `${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} đ`;
};
