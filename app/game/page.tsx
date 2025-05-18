"use client";
import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import Script from "next/script";

// Global untuk MediaPipe Camera
declare global {
  interface Window {
    Camera: any;
    Hands: any;
  }
}

export default function GamePage() {
  const webcamRef = useRef<Webcam>(null);
  const sfx = useRef({
    countdown: typeof Audio !== "undefined" ? new Audio("/sfx/countdown.mp3") : null,
    detect: typeof Audio !== "undefined" ? new Audio("/sfx/detect.mp3") : null,
    win: typeof Audio !== "undefined" ? new Audio("/sfx/win.mp3") : null,
    lose: typeof Audio !== "undefined" ? new Audio("/sfx/lose.mp3") : null,
    draw: typeof Audio !== "undefined" ? new Audio("/sfx/draw.mp3") : null,
  });

  const [gesture, setGesture] = useState("");
  const [score, setScore] = useState({ player: 0, ai: 0 });
  const [result, setResult] = useState("");
  const [isModelReady, setIsModelReady] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const roundPlayedRef = useRef(false);
  const isActiveRef = useRef(true);

  useEffect(() => {
    isActiveRef.current = true;

    const video = webcamRef.current?.video;
    if (!video || typeof window === "undefined") return;

    let hands: any;
    let camera: any;

    const waitForMediapipe = setInterval(() => {
      if (window.Hands && window.Camera) {
        clearInterval(waitForMediapipe);

        hands = new window.Hands({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 0,
          minDetectionConfidence: 0.75,
          minTrackingConfidence: 0.75,
        });

        hands.onResults((results: any) => {
          if (!isActiveRef.current || roundPlayedRef.current || !gameStarted) return;

          setIsModelReady(true);

          const landmarks = results.multiHandLandmarks?.[0];
          if (landmarks) {
            const gestureName = classifyGesture(landmarks);

            if (gestureName) {
              roundPlayedRef.current = true;
              setGameStarted(false);
              sfx.current.detect?.play();
              setGesture(gestureName);

              setTimeout(() => playRound(gestureName), 100);
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
      clearInterval(waitForMediapipe);
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
      sfx.current.draw?.play();
    } else if (
      (playerMove === "rock" && aiMove === "scissors") ||
      (playerMove === "paper" && aiMove === "rock") ||
      (playerMove === "scissors" && aiMove === "paper")
    ) {
      outcome = "You win!";
      sfx.current.win?.play();
      setScore((s) => ({ ...s, player: s.player + 1 }));
    } else {
      outcome = "AI wins!";
      sfx.current.lose?.play();
      setScore((s) => ({ ...s, ai: s.ai + 1 }));
    }

    setResult(`${playerMove} vs ${aiMove} → ${outcome}`);

    setTimeout(() => {
      setGesture("");
      roundPlayedRef.current = false;
    }, 1500);
  };

  const startGame = () => {
    setCountdown(3);
    setGesture("");
    setResult("");
    roundPlayedRef.current = false;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        sfx.current.countdown?.play();

        if (prev === 1) {
          clearInterval(interval);
          setCountdown(null);
          setGameStarted(true);
          return null;
        }

        return (prev ?? 1) - 1;
      });
    }, 1000);
  };

  return (
    <>
      {/* CDN Scripts */}
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
          {gesture
            ? `Detected: ${gesture.toUpperCase()}`
            : countdown !== null
            ? `Get Ready... ${countdown}`
            : gameStarted
            ? "Mendeteksi gestur..."
            : ""}
        </h2>

        <p className="mt-2">
          Score: You {score.player} - AI {score.ai}
        </p>

        <button
          onClick={startGame}
          disabled={!isModelReady || countdown !== null || gameStarted}
          className="px-6 py-2 mt-4 bg-blue-500 hover:bg-blue-700 rounded-lg transition disabled:bg-gray-600"
        >
          {isModelReady ? "Start Game" : "Loading Model..."}
        </button>

        {result && (
          <p className="mt-6 text-lg text-green-400 font-semibold">{result}</p>
        )}
      </div>
    </>
  );
}
