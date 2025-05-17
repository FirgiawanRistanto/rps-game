// lib/gestureClassifier.ts
export const classifyGesture = (landmarks: NormalizedLandmarkList) => {
  if (!landmarks || landmarks.length !== 21) return 'unknown';

  const [thumbTip, indexTip, middleTip, ringTip, pinkyTip] = [
    landmarks[4],
    landmarks[8],
    landmarks[12],
    landmarks[16],
    landmarks[20],
  ];

  const indexFolded = indexTip.y > landmarks[6].y;
  const middleFolded = middleTip.y > landmarks[10].y;
  const ringFolded = ringTip.y > landmarks[14].y;
  const pinkyFolded = pinkyTip.y > landmarks[18].y;

  // ✊ Rock
  if (indexFolded && middleFolded && ringFolded && pinkyFolded) {
    return 'rock';
  }

  // ✋ Paper
  if (!indexFolded && !middleFolded && !ringFolded && !pinkyFolded) {
    return 'paper';
  }

  // ✌ Scissors
  if (!indexFolded && !middleFolded && ringFolded && pinkyFolded) {
    return 'scissors';
  }

  return 'unknown';
};
