Date.prototype.createUTCDate = function () {
  return new Date(
    Date.UTC(
      this.getUTCFullYear(),
      this.getUTCMonth(),
      this.getUTCDate(),
      this.getUTCHours(),
      this.getUTCMinutes(),
      this.getUTCSeconds(),
    ),
  );
};
Date.prototype.displayDMY = function () {
  // const M = [
  //   'January',
  //   'February',
  //   'March',
  //   'April',
  //   'May',
  //   'June',
  //   'July',
  //   'August',
  //   'September',
  //   'October',
  //   'November',
  //   'December',
  // ];
  const Ms = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  // const d = [
  //   'Monday',
  //   'Tuesday',
  //   'Wednesday',
  //   'Thursday',
  //   'Friday',
  //   'Saturday',
  //   'Sunday',
  // ];
  // const h = this.getHours() < 10 ? `0${this.getHours()}` : this.getHours();
  // const m =
  //   this.getMinutes() < 10 ? `0${this.getMinutes()}` : this.getMinutes();
  return `${this.getDate()} ${Ms[this.getMonth()]}, ${this.getFullYear()}`;
};
Date.prototype.displayMY = function () {
  // const M = [
  //   'January',
  //   'February',
  //   'March',
  //   'April',
  //   'May',
  //   'June',
  //   'July',
  //   'August',
  //   'September',
  //   'October',
  //   'November',
  //   'December',
  // ];
  const Ms = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  // const d = [
  //   'Monday',
  //   'Tuesday',
  //   'Wednesday',
  //   'Thursday',
  //   'Friday',
  //   'Saturday',
  //   'Sunday',
  // ];
  // const h = this.getHours() < 10 ? `0${this.getHours()}` : this.getHours();
  // const m =
  //   this.getMinutes() < 10 ? `0${this.getMinutes()}` : this.getMinutes();
  return `${Ms[this.getMonth()]}, ${this.getFullYear()}`;
};
Date.prototype.displayYear = function () {
  this.getFullYear();
};
Date.prototype.displayMonth = function () {
  const M = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  // const Ms = [
  //   'Jan',
  //   'Feb',
  //   'Mar',
  //   'Apr',
  //   'May',
  //   'Jun',
  //   'Jul',
  //   'Aug',
  //   'Sep',
  //   'Oct',
  //   'Nov',
  //   'Dec',
  // ];
  return `${M[this.getMonth()]}`;
};
Date.prototype.displayDay = function () {
  // const M = [
  //   'January',
  //   'February',
  //   'March',
  //   'April',
  //   'May',
  //   'June',
  //   'July',
  //   'August',
  //   'September',
  //   'October',
  //   'November',
  //   'December',
  // ];
  const Ms = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return `${this.getDate()} ${Ms[this.getMonth()]}`;
};
Date.prototype.displayHM = function () {
  const h = this.getHours() < 10 ? `0${this.getHours()}` : this.getHours();
  const m =
    this.getMinutes() < 10 ? `0${this.getMinutes()}` : this.getMinutes();
  return `${h}:${m}`;
};
Date.prototype.displayMinute = function () {
  const h = this.getHours() < 10 ? `0${this.getHours()}` : this.getHours();
  const m =
    this.getMinutes() < 10 ? `0${this.getMinutes()}` : this.getMinutes();
  return `${h}:${m}`;
};
Date.prototype.display_for_query = function () {
  const m =
    this.getMonth() + 1 < 10 ? `0${this.getMonth() + 1}` : this.getMonth() + 1;
  const d = this.getDate() < 10 ? `0${this.getDate()}` : this.getDate();
  return `${this.getFullYear()}-${m}-${d}`;
};
Date.prototype.getDaysInMonth = function () {
  const date = new Date(this.getFullYear(), this.getMonth(), 1);
  const month = this.getMonth();
  const days = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
};
Date.prototype.render = function () {
  return `${this.getDate() < 10 ? `0${this.getDate()}` : this.getDate()}-${
    this.getMonth() + 1 < 10 ? `0${this.getMonth() + 1}` : this.getMonth() + 1
  }-${this.getFullYear()}`;
};

window.ExcelDateToJSDate = function (serial) {
  // CREDIT TO https://stackoverflow.com/questions/16229494/converting-excel-date-serial-number-to-date-using-javascript
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  const fractional_day = serial - Math.floor(serial) + 0.0000001;
  let total_seconds = Math.floor(86400 * fractional_day);
  const seconds = total_seconds % 60;
  total_seconds -= seconds;
  const hours = Math.floor(total_seconds / (60 * 60));
  const minutes = Math.floor(total_seconds / 60) % 60;
  return new Date(
    date_info.getFullYear(),
    date_info.getMonth(),
    date_info.getDate(),
    hours,
    minutes,
    seconds,
  );
};
window.isValidDate = function (d) {
  // CREDIT TO https://stackoverflow.com/questions/1353684/detecting-an-invalid-date-date-instance-in-javascript
  return d instanceof Date && !isNaN(d);
};
