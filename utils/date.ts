export const isToday = (isoDateString: string): boolean => {
  const date = new Date(isoDateString);
  const today = new Date();
  
  return date.getFullYear() === today.getFullYear() &&
         date.getMonth() === today.getMonth() &&
         date.getDate() === today.getDate();
};
