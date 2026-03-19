export function formatDateTime(value?: string | null): string {
  if (!value) {
    return 'Không có';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}
