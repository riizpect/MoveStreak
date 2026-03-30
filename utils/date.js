export function storageDateKey(date = new Date()) {
  return new Date(date).toLocaleDateString('sv-SE');
}

export function toMiddayDate(date) {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  return d;
}

export function dateRangeKeys(startDate, endDate) {
  const keys = [];
  const cursor = new Date(startDate);
  const end = new Date(endDate);
  cursor.setHours(12, 0, 0, 0);
  end.setHours(12, 0, 0, 0);
  while (cursor <= end) {
    keys.push(storageDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys;
}
