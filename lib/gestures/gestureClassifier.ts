import type { NormalizedLandmarkList } from "@mediapipe/hands";

export const classifyGesture = (landmarks: NormalizedLandmarkList) => {
  if (!landmarks || landmarks.length !== 21) return "unknown";

  const y = (i: number) => landmarks[i].y;

  const indexFolded = y(8) > y(6) + 0.02;
  const middleFolded = y(12) > y(10) + 0.02;
  const ringFolded = y(16) > y(14) + 0.02;
  const pinkyFolded = y(20) > y(18) + 0.02;

  // ✊ Rock
  if (indexFolded && middleFolded && ringFolded && pinkyFolded) {
    return "rock";
  }

  // ✋ Paper
  if (!indexFolded && !middleFolded && !ringFolded && !pinkyFolded) {
    return "paper";
  }

  // ✌️ Scissors
  if (!indexFolded && !middleFolded && ringFolded && pinkyFolded) {
    return "scissors";
  }

  return "unknown";
};
