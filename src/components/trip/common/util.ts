import dayjs from 'dayjs';

export const formatTime = (language: string, input: Date) => {
  return input.toLocaleTimeString(language, {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDate = (language: string, input: Date) => {
  return input.toLocaleDateString(language, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const getTravelTime = (start: Date, end: Date): string => {
  const s = dayjs(start);
  const e = dayjs(end);
  const hoursDiff = e.diff(s, 'hours', false);
  const minutesDiff = e.diff(s, 'minutes', false);
  const remainingMinutes = minutesDiff - hoursDiff * 60;

  if (remainingMinutes === 0) {
    return `${hoursDiff} hour(s)`;
  }

  return `${hoursDiff} hour(s) & ${remainingMinutes} minutes`;
};

export const getNumberOfDays = (start: Date, end: Date): string => {
  const s = dayjs(start);
  const e = dayjs(end);
  const days = e.diff(s, 'days', false);
  return `${days} day(s)`;
};

export const downloadAsBase64 = async (url: string) => {
  const response = await fetch(url);
  const blob = await response.blob();
  const reader = new FileReader();
  await new Promise((resolve, reject) => {
    reader.onload = resolve;
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  const readerResult = reader.result;
  if (!readerResult) {
    return null;
  }

  if (typeof readerResult === 'string') {
    return readerResult;
  }

  return readerResult;
};