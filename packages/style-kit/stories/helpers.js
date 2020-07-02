export const titleWord = word => word.slice(0, 1).toUpperCase() + word.slice(1);

export const titleWords = words =>
  words
    .split(' ')
    .map(titleWord)
    .join(' ');
