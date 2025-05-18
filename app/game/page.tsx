"use client";
import { useEffect, useRef, useState } from "react";
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
  const [gameStarted, setGameStarted] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false); // 🔥 NEW STATE

  const roundPlayedRef = useRef(false);
  const isActiveRef = useRef(true);

  useEffect(() => {
    isActiveRef.current = true;
    if (!webcamRef.current || typeof window === "undefined") return;

    const video = webcamRef.current.video;
    if (!video) return;

    let hands: any;
    let camera: any;

    const interval = setInterval(() => {
      if ((window as any).Hands && window.Camera) {
        clearInterval(interval);

        hands = new (window as any).Hands({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.8,
          minTrackingConfidence: 0.8,
        });

        hands.onResults((results: any) => {
          if (!isActiveRef.current) return;

          setIsModelReady(true);

          if (
            results.multiHandLandmarks &&
            results.multiHandLandmarks.length > 0 &&
            gameStarted &&
            !roundPlayedRef.current
          ) {
            const landmarks = results.multiHandLandmarks[0];
            const gestureName = classifyGesture(landmarks);

            if (gestureName) {
              setGesture(gestureName);
              playRound(gestureName);
              roundPlayedRef.current = true;
              setGameStarted(false);
              setIsDetecting(false); // 🔥 CLOSE LOADING
              setShowResultModal(true);
            }
          }
        });

        camera = new window.Camera(video, {
          onFrame: async () => {
            await hands.send({ image: video });
          },
          width: 640,
          height: 480,
        });

        camera.start();
      }
    }, 100);

    return () => {
      isActiveRef.current = false;
      clearInterval(interval);
      if (camera) camera.stop();
    };
  }, [gameStarted]);

  const classifyGesture = (landmarks: any[]): string => {
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];

    const isFist =
      indexTip.y > landmarks[6].y &&
      middleTip.y > landmarks[10].y &&
      ringTip.y > landmarks[14].y &&
      pinkyTip.y > landmarks[18].y;

    const isOpenPalm =
      indexTip.y < landmarks[6].y &&
      middleTip.y < landmarks[10].y &&
      ringTip.y < landmarks[14].y &&
      pinkyTip.y < landmarks[18].y;

    const isScissors =
      indexTip.y < landmarks[6].y &&
      middleTip.y < landmarks[10].y &&
      ringTip.y > landmarks[14].y &&
      pinkyTip.y > landmarks[18].y;

    if (isFist) return "rock";
    if (isOpenPalm) return "paper";
    if (isScissors) return "scissors";
    return "";
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

  const startGame = () => {
    setCountdown(3);
    setGesture("");
    setResult("");
    setShowResultModal(false);
    roundPlayedRef.current = false;
    setIsDetecting(false); // Reset loading modal

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(interval);
          setGameStarted(true);
          setIsDetecting(true); // 🔥 SHOW LOADING
          return null;
        }
        return (prev ?? 1) - 1;
      });
    }, 1000);
  };

  return (
    <>
      {/* Load MediaPipe Hands and Camera Utils */}
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
        />

        <h2 className="mt-4 text-yellow-400 text-2xl font-bold">
          Detected Gesture: {gesture || "..."}
        </h2>

        <p className="mt-2">Score: You {score.player} - AI {score.ai}</p>

        {countdown !== null ? (
          <p className="text-3xl text-red-500 font-bold mb-2 animate-pulse">
            Get Ready... {countdown}
          </p>
        ) : !isDetecting ? (
          <button
            onClick={startGame}
            disabled={!isModelReady}
            className="px-6 py-2 mt-4 bg-blue-500 hover:bg-blue-700 rounded-lg transition disabled:bg-gray-600"
          >
            {isModelReady ? "Start Game" : "Loading Model..."}
          </button>
        ) : null}

        {/* Modal loading gesture detection */}
        {isDetecting && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg max-w-sm w-full text-center">
              <div className="mb-4">
                <div className="w-12 h-12 border-4 border-blue-400 border-dashed rounded-full animate-spin mx-auto"></div>
              </div>
              <p className="text-lg text-white">Mendeteksi gestur...</p>
            </div>
          </div>
        )}

        {/* Modal hasil match */}
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
