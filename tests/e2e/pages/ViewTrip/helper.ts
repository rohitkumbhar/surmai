import dayjs from 'dayjs';

export const getStartDate = (tripStart: string) => {
  // const result = new Date(tripStart);
  const randomDay = Math.floor(Math.random() * 15) + 1;
  return dayjs(tripStart).add(randomDay, 'day').format('YYYY-MM-DD');
  // result.setDate(randomDay);
  // return result;
};

export const getEndDate = (start: string, days: number) => {

  return dayjs(start).add(days, 'day').format('YYYY-MM-DD');

};

export const getSelectorString = (date: string) => {
  const dateStr = dayjs(date).format('D MMMM YYYY');
  return `button[aria-label="${dateStr}"]`;
};
