"use client";
import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";

export default function GamePage() {
  const webcamRef = useRef<Webcam>(null);
  const [gesture, setGesture] = useState("");
  const [result, setResult] = useState("");
  const [score, setScore] = useState({ player: 0, ai: 0 });
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [gameStarted, setGameStarted] = useState(false);

  const sfx = useRef({
    countdown: typeof Audio !== "undefined" ? new Audio("/sfx/countdown.mp3") : null,
    detect: typeof Audio !== "undefined" ? new Audio("/sfx/detect.mp3") : null,
    win: typeof Audio !== "undefined" ? new Audio("/sfx/win.mp3") : null,
    lose: typeof Audio !== "undefined" ? new Audio("/sfx/lose.mp3") : null,
    draw: typeof Audio !== "undefined" ? new Audio("/sfx/draw.mp3") : null,
  });

  const roundPlayedRef = useRef(false);
  const cameraRef = useRef<any>(null);
  const handsRef = useRef<any>(null);

  const initModel = async () => {
    const { Hands } = await import("@mediapipe/hands");
    const { Camera } = await import("@mediapipe/camera_utils");

    const video = webcamRef.current?.video;
    if (!video) return;

    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 0,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    hands.onResults((results: any) => {
      if (!gameStarted || roundPlayedRef.current) return;

      const landmarks = results.multiHandLandmarks?.[0];
      if (landmarks) {
        const move = classifyGesture(landmarks);
        if (move) {
          roundPlayedRef.current = true;
          setGameStarted(false);
          sfx.current.detect?.play();
          setGesture(move);
          setTimeout(() => playRound(move), 100);
        }
      }
    });

    const camera = new Camera(video, {
      onFrame: async () => {
        await hands.send({ image: video });
      },
      width: 640,
      height: 480,
    });

    handsRef.current = hands;
    cameraRef.current = camera;

    camera.start();
    setLoading(false);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      initModel();
    }
    return () => {
      cameraRef.current?.stop?.();
    };
  }, []);

  const classifyGesture = (landmarks: any[]) => {
    const index = landmarks[8];
    const middle = landmarks[12];
    const ring = landmarks[16];
    const pinky = landmarks[20];

    const isFist =
      index.y > landmarks[6].y &&
      middle.y > landmarks[10].y &&
      ring.y > landmarks[14].y &&
      pinky.y > landmarks[18].y;

    const isPalm =
      index.y < landmarks[6].y &&
      middle.y < landmarks[10].y &&
      ring.y < landmarks[14].y &&
      pinky.y < landmarks[18].y;

    const isScissors =
      index.y < landmarks[6].y &&
      middle.y < landmarks[10].y &&
      ring.y > landmarks[14].y &&
      pinky.y > landmarks[18].y;

    if (isFist) return "rock";
    if (isPalm) return "paper";
    if (isScissors) return "scissors";
    return "";
  };

  const playRound = (playerMove: string) => {
    const aiMove = ["rock", "paper", "scissors"][Math.floor(Math.random() * 3)];
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
      setScore((prev) => ({ ...prev, player: prev.player + 1 }));
    } else {
      outcome = "AI wins!";
      sfx.current.lose?.play();
      setScore((prev) => ({ ...prev, ai: prev.ai + 1 }));
    }

    setResult(`${playerMove} vs ${aiMove} → ${outcome}`);
    setTimeout(() => {
      setGesture("");
      roundPlayedRef.current = false;
    }, 1500);
  };

  const startGame = () => {
    setCountdown(3);
    setResult("");
    setGesture("");
    roundPlayedRef.current = false;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(interval);
          setCountdown(null);
          setGameStarted(true);
          return null;
        }
        sfx.current.countdown?.play();
        return (prev ?? 1) - 1;
      });
    }, 1000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <Webcam ref={webcamRef} mirrored className="rounded-lg shadow-lg w-full max-w-md" />

      <h2 className="mt-4 text-yellow-400 text-2xl font-bold">
        {gesture
          ? `Detected: ${gesture.toUpperCase()}`
          : countdown !== null
          ? `Get Ready... ${countdown}`
          : gameStarted
          ? "Mendeteksi gestur..."
          : ""}
      </h2>

      <p className="mt-2">Score: You {score.player} - AI {score.ai}</p>

      <button
        onClick={startGame}
        disabled={loading || countdown !== null || gameStarted}
        className="px-6 py-2 mt-4 bg-blue-500 hover:bg-blue-700 rounded-lg transition disabled:bg-gray-600"
      >
        {loading ? "Loading Model..." : "Start Game"}
      </button>

      {result && (
        <p className="mt-6 text-lg text-green-400 font-semibold">{result}</p>
      )}
    </div>
  );
}
