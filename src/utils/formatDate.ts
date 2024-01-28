const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);

  // Set the time zone offset to egypt time zone
  date.setMinutes(date.getMinutes() + 120);

  // Get the individual components (date, month, year, hour, minute) from the date
  const day = date.getDate();
  const month = date.getMonth() + 1; // Months are zero-based, so add 1
  const year = date.getFullYear();
  const hour = date.getHours();
  const minute = date.getMinutes(); // Get the minutes
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12; // Convert to 12-hour format

  // Format the components into the desired string
  const formattedDate = `${day}/${month}/${year} ${hour12}:${minute < 10 ? "0" : ""}${minute}${ampm} (UTC+2)`;
  return formattedDate;
};
export default formatDate;
