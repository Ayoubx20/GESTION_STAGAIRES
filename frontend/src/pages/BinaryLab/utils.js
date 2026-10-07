export const decimalToBinary = (num) => {
  if (isNaN(num) || num < 0) return '0';
  return Number(num).toString(2);
};

export const binaryToDecimal = (bin) => {
  if (!/^[01]+$/.test(bin)) return 0;
  return parseInt(bin, 2);
};

export const charToBinary = (char) => {
  return char.charCodeAt(0).toString(2).padStart(8, '0');
};

export const binaryToChar = (bin) => {
  if (bin.length !== 8 || !/^[01]+$/.test(bin)) return '?';
  return String.fromCharCode(parseInt(bin, 2));
};

const FEEDBACK_CORRECT = [
  "🔥 Nice!",
  "You're getting dangerous with these 1s and 0s.",
  "Binary has nothing on you!",
  "Clean conversion!",
  "The computer approves 🤖",
  "01001000 01101001... you're cooking!"
];

const FEEDBACK_WRONG = [
  "👀 Close!",
  "The zeros and ones fought back.",
  "Not quite — try reading the place values.",
  "The computer says: nope 🤖",
  "Almost! You've got this."
];

export const getRandomFeedback = (isCorrect) => {
  const arr = isCorrect ? FEEDBACK_CORRECT : FEEDBACK_WRONG;
  return arr[Math.floor(Math.random() * arr.length)];
};
