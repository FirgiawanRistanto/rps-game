const gestureHistory: string[] = [];
const maxHistory = 5;

export const smoothGesture = (newGesture: string) => {
  gestureHistory.push(newGesture);
  if (gestureHistory.length > maxHistory) gestureHistory.shift();

  const counts: Record<string, number> = {};
  gestureHistory.forEach((g) => {
    counts[g] = (counts[g] || 0) + 1;
  });

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0][0];
};

export const resetGestureHistory = () => {
  gestureHistory.length = 0;
};
