export default (date: number) => {
  if (!date) {
    return false;
  }
  const timeDifference = new Date().getTime() - date;
  return Math.round(timeDifference / (1000 * 60 * 60 * 24));
};
