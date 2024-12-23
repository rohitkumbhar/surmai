import dayjs from 'dayjs';

export const formatTime = (input: Date) => {
  return `${String(input.getHours()).padStart(2, '0')}:${String(input.getMinutes()).padStart(2, '0')}`;
};

export const formatDate = (language: string, input: Date) => {
  return input.toLocaleDateString(language, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const fakeAsUtcString = (date: Date | undefined): string => {
  if (!date) {
    return '';
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:00.000Z`;
};

export const convertSavedToBrowserDate = (dateString: string) => {
  const d = dayjs(dateString, 'UTC').tz('UTC');
  const convertedDate = new Date();
  convertedDate.setFullYear(d.year());
  convertedDate.setMonth(d.month());
  convertedDate.setDate(d.date());
  convertedDate.setHours(d.hour());
  convertedDate.setMinutes(d.minute());
  convertedDate.setSeconds(0);
  convertedDate.setMilliseconds(0);
  return convertedDate;
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
