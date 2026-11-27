export const formatAmount = (amount, forceDecimals = false) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '—';
  const num = Number(amount);
  const hasDecimals = num % 1 !== 0;
  return new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR',
    minimumFractionDigits: forceDecimals || hasDecimals ? 2 : 0,
    maximumFractionDigits: 2
  }).format(num);
};

export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};
