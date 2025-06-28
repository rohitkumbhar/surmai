import dayjs from 'dayjs';

export const basicInfoFormValidation = {
  dateRange: (value: [string | null, string | null]) => {
    if (!value) {
      return 'A value is required';
    }

    if (value.length != 2 || !value[0] || !value[1]) {
      return 'A start date and end date is required';
    }


    const start = dayjs(value[0])
    const end = dayjs(value[1])

    if (start.isAfter(end)) {
      return 'End date cannot be earlier than start date';
    }

    return null;
  },
};
