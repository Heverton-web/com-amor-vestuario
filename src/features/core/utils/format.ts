export function formatCurrency(val: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}
export function brl(val: number): string {
  return formatCurrency(val);
}
export function formatDate(val: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(val));
}
export function dateTimeBR(val: string | Date): string {
  return formatDate(val);
}
export function dateBR(val: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(val));
}
export function dateString(val: string | Date): string {
  return dateBR(val);
}
