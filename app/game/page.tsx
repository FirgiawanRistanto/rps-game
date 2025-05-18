// app/game/page.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import Script from "next/script";

// Global untuk MediaPipe Camera
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
  const [showDetectingModal, setShowDetectingModal] = useState(false);

  const roundPlayedRef = useRef(false);
  const isActiveRef = useRef(true);

  // Audio effects
  const sfx = {
    countdown: new Audio("/sfx/countdown.mp3"),
    detect: new Audio("/sfx/detect.mp3"),
    win: new Audio("/sfx/win.mp3"),
    lose: new Audio("/sfx/lose.mp3"),
    draw: new Audio("/sfx/draw.mp3"),
  };

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
          modelComplexity: 0, // lighter model
          minDetectionConfidence: 0.75,
          minTrackingConfidence: 0.75,
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
              sfx.detect.play();
              setGesture(gestureName);
              playRound(gestureName);
              roundPlayedRef.current = true;
              setGameStarted(false);
              setShowDetectingModal(false);
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
    if (playerMove === aiMove) {
      outcome = "Draw";
      sfx.draw.play();
    } else if (
      (playerMove === "rock" && aiMove === "scissors") ||
      (playerMove === "paper" && aiMove === "rock") ||
      (playerMove === "scissors" && aiMove === "paper")
    ) {
      outcome = "You win!";
      sfx.win.play();
      setScore((s) => ({ ...s, player: s.player + 1 }));
    } else {
      outcome = "AI wins!";
      sfx.lose.play();
      setScore((s) => ({ ...s, ai: s.ai + 1 }));
    }

    setResult(`${playerMove} vs ${aiMove} → ${outcome}`);
  };

  const startGame = () => {
    setCountdown(3);
    setGesture("");
    setResult("");
    setShowResultModal(false);
    setShowDetectingModal(false);
    roundPlayedRef.current = false;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        sfx.countdown.play();
        if (prev === 1) {
          clearInterval(interval);
          setCountdown(null);
          setGameStarted(true);
          setShowDetectingModal(true);
          return null;
        }
        return (prev ?? 1) - 1;
      });
    }, 1000);
  };

  return (
    <>
      {/* CDN Script Loader */}
      <Script
        src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.min.js"
        strategy="beforeInteractive"
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.min.js"
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
            disabled={!isModelReady || countdown !== null || gameStarted}
            className="px-6 py-2 mt-4 bg-blue-500 hover:bg-blue-700 rounded-lg transition disabled:bg-gray-600"
          >
            {isModelReady ? "Start Game" : "Loading Model..."}
          </button>
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

        {/* Modal mendeteksi gesture */}
        {showDetectingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
            <div className="bg-gray-900 p-6 rounded-lg text-center animate-pulse">
              <h2 className="text-lg font-semibold">Mendeteksi gestur...</h2>
              <p className="text-sm text-gray-300 mt-2">Arahkan tanganmu ke kamera</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
