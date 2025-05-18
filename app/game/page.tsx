"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import Script from "next/script";

declare global {
  interface Window {
    Camera: any;
  }
}

export default function GamePage() {
  const webcamRef = useRef<Webcam>(null);
  const [gesture, setGesture] = useState("");
  const [score, setScore] = useState({ player: 0, ai: 0 });
  const [result, setResult] = useState("");
  const [isModelReady, setIsModelReady] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);

  const gameStartedRef = useRef(false);
  const roundPlayedRef = useRef(false);
  const handsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const setupModel = useCallback(() => {
    if ((window as any).Hands && window.Camera && webcamRef.current?.video) {
      const hands = new (window as any).Hands({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 0,
        minDetectionConfidence: 0.8,
        minTrackingConfidence: 0.8,
      });

      hands.onResults((results: any) => {
        if (
          results.multiHandLandmarks &&
          results.multiHandLandmarks.length > 0 &&
          gameStartedRef.current &&
          !roundPlayedRef.current
        ) {
          const landmarks = results.multiHandLandmarks[0];
          const gestureName = classifyGesture(landmarks);

          if (gestureName) {
            setGesture(gestureName);
            playRound(gestureName);
            roundPlayedRef.current = true;
            gameStartedRef.current = false;
            setIsDetecting(false);
            setShowResultModal(true);
          }
        }
      });

      const video = webcamRef.current.video;
      videoRef.current = video;

      const camera = new window.Camera(video, {
        onFrame: async () => {
          await hands.send({ image: video });
        },
        width: 480,
        height: 360,
      });

      camera.start();

      handsRef.current = hands;
      cameraRef.current = camera;

      setIsModelReady(true);
    }
  }, []);

  useEffect(() => {
    const checkReady = setInterval(() => {
      if ((window as any).Hands && window.Camera && webcamRef.current?.video) {
        clearInterval(checkReady);
        setupModel();
      }
    }, 100);

    return () => {
      clearInterval(checkReady);
      cameraRef.current?.stop();
    };
  }, [setupModel]);

  const startGame = () => {
    setGesture("");
    setResult("");
    setShowResultModal(false);
    setCountdown(3);
    roundPlayedRef.current = false;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(timer);
          gameStartedRef.current = true;
          setIsDetecting(true);

          setTimeout(() => {
            if (!roundPlayedRef.current) {
              setResult("Tidak dapat mendeteksi gestur. Coba lagi!");
              setShowResultModal(true);
              setIsDetecting(false);
              gameStartedRef.current = false;
            }
          }, 3000);

          return null;
        }
        return (prev ?? 1) - 1;
      });
    }, 1000);
  };

  const playRound = (playerMove: string) => {
    const moves = ["rock", "paper", "scissors"];
    const aiMove = moves[Math.floor(Math.random() * 3)];

    let outcome = "";
    if (playerMove === aiMove) outcome = "Draw";
    else if (
      (playerMove === "rock" && aiMove === "scissors") ||
      (playerMove === "paper" && aiMove === "rock") ||
      (playerMove === "scissors" && aiMove === "paper")
    ) {
      outcome = "You win!";
      setScore((s) => ({ ...s, player: s.player + 1 }));
    } else {
      outcome = "AI wins!";
      setScore((s) => ({ ...s, ai: s.ai + 1 }));
    }

    setResult(`${playerMove} vs ${aiMove} → ${outcome}`);
  };

  const classifyGesture = (landmarks: any[]): string => {
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];

    const isFist =
      indexTip.y > landmarks[6].y + 0.03 &&
      middleTip.y > landmarks[10].y + 0.03 &&
      ringTip.y > landmarks[14].y + 0.03 &&
      pinkyTip.y > landmarks[18].y + 0.03;

    const isOpenPalm =
      indexTip.y < landmarks[6].y - 0.02 &&
      middleTip.y < landmarks[10].y - 0.02 &&
      ringTip.y < landmarks[14].y - 0.02 &&
      pinkyTip.y < landmarks[18].y - 0.02;

    const isScissors =
      indexTip.y < landmarks[6].y - 0.02 &&
      middleTip.y < landmarks[10].y - 0.02 &&
      ringTip.y > landmarks[14].y + 0.02 &&
      pinkyTip.y > landmarks[18].y + 0.02;

    if (isFist) return "rock";
    if (isOpenPalm) return "paper";
    if (isScissors) return "scissors";

    return "";
  };

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js"
        strategy="beforeInteractive"
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"
        strategy="beforeInteractive"
      />

      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
        <Webcam
          ref={webcamRef}
          mirrored
          className="rounded-lg shadow-lg w-full max-w-md"
          videoConstraints={{
            width: 480,
            height: 360,
            facingMode: "user",
          }}
        />

        <h2 className="mt-4 text-yellow-400 text-2xl font-bold">
          Detected Gesture: {gesture || "..."}
        </h2>

        <p className="mt-2">
          Score: You {score.player} - AI {score.ai}
        </p>

        {countdown !== null ? (
          <p className="text-3xl text-red-500 font-bold mb-2 animate-pulse">
            Get Ready... {countdown}
          </p>
        ) : (
          <button
            onClick={startGame}
            disabled={!isModelReady || isDetecting}
            className="px-6 py-2 mt-4 bg-blue-500 hover:bg-blue-700 rounded-lg transition disabled:bg-gray-600"
          >
            {isModelReady
              ? isDetecting
                ? "Mendeteksi Gestur..."
                : "Start Game"
              : "Loading Model..."}
          </button>
        )}

        {showResultModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
            onClick={() => setShowResultModal(false)}
          >
            <div
              className="bg-gray-800 p-6 rounded-lg max-w-sm w-full text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4">Round Result</h3>
              <p className="mb-6 text-lg">{result}</p>
              <button
                onClick={() => setShowResultModal(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
