import { format } from 'date-fns';

export const DATE_FORMAT = 'dd/MM/yyyy';
export const DATETIME_FORMAT = 'dd/MM/yyyy hh:mm a';

export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return '—';
  try {
    return format(new Date(date), DATE_FORMAT);
  } catch (error) {
    return '—';
  }
};

export const formatDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return '—';
  try {
    return format(new Date(date), DATETIME_FORMAT);
  } catch (error) {
    return '—';
  }
};
