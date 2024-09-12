export const basicInfoFormValidation = {
  dateRange: (value) => {
    if (!value) {
      return "A value is required";
    }

    if (value.length != 2 || !value[0] || !value[1]) {
      return "A start date and end date is required"
    }

    if (value[0].getTime() > value[1].getTime()) {
      return "End date cannot be earlier than start date"
    }

    return null;

  }
}