import dayjs from 'dayjs';

export const getStartDate = (tripStart: Date) => {
  const result = new Date(tripStart);
  const randomDay = Math.floor(Math.random() * 15) + 1;
  result.setDate(randomDay);
  return result;
};

export const getEndDate = (start: Date, days: number) => {
  return new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
};

export const getSelectorString = (date: Date) => {
  const dateStr = dayjs(date).format('D MMMM YYYY');
  return `button[aria-label="${dateStr}"]`;
};
