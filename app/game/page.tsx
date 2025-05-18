"use client";

import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import Script from "next/script";

declare global {
  interface Window {
    Hands: any;
  }
}

export default function GamePage() {
  const webcamRef = useRef<Webcam>(null);
  const handsRef = useRef<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [gesture, setGesture] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [statusText, setStatusText] = useState("Loading model...");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    if (!window.Hands) return;

    const hands = new window.Hands({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 0,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults(onResults);
    handsRef.current = hands;
    setIsReady(true);
    setStatusText("Model ready.");

    return () => {
      intervalRef.current && clearInterval(intervalRef.current);
      handsRef.current = null;
    };
  }, []);

  const onResults = (results: any) => {
    if (results.multiHandLandmarks?.length) {
      const gestureName = classifyGesture(results.multiHandLandmarks[0]);
      if (gestureName) setGesture(gestureName);
    }
  };

  const startDetection = () => {
    if (!handsRef.current || !webcamRef.current?.video) return;

    intervalRef.current && clearInterval(intervalRef.current);

    intervalRef.current = setInterval(async () => {
      const video = webcamRef.current!.video!;
      if (video.readyState === 4) {
        await handsRef.current.send({ image: video });
      }
    }, 33); // ≈ 30 fps
  };

  const classifyGesture = (landmarks: any[]): string => {
    const [index, middle, ring, pinky] = [
      landmarks[8],
      landmarks[12],
      landmarks[16],
      landmarks[20],
    ];

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

  const startGame = () => {
    if (!isReady) return;

    let count = 3;
    setGesture("");
    setStatusText("Get ready...");
    setCountdown(count);
    setResult(null);

    const interval = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(interval);
        setCountdown(null);
        setGameStarted(true);
        setStatusText("Detecting...");
        startDetection();
      } else {
        setCountdown(count);
      }
    }, 1000);
  };

  useEffect(() => {
    if (gameStarted) {
      const timeout = setTimeout(() => {
        setGameStarted(false);
        setStatusText("Result!");

        if (gesture) {
          const botChoices = ["rock", "paper", "scissors"];
          const botChoice =
            botChoices[Math.floor(Math.random() * botChoices.length)];

          let outcome = "";
          if (gesture === botChoice) outcome = "Draw!";
          else if (
            (gesture === "rock" && botChoice === "scissors") ||
            (gesture === "paper" && botChoice === "rock") ||
            (gesture === "scissors" && botChoice === "paper")
          )
            outcome = "You win!";
          else outcome = "You lose!";

          setResult(`You: ${gesture} | Bot: ${botChoice} → ${outcome}`);
        } else {
          setResult("No gesture detected!");
        }

        intervalRef.current && clearInterval(intervalRef.current);
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [gameStarted, gesture]);

  return (
    <>
      <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.min.js" strategy="beforeInteractive" />
      <div className="flex flex-col items-center min-h-screen bg-black text-white p-4">
        <Webcam ref={webcamRef} mirrored className="w-72 rounded" />

        {/* Countdown */}
        {countdown !== null && (
          <p className="text-7xl text-red-500 font-extrabold mb-4 animate-ping">
            {countdown}
          </p>
        )}

        {/* Gesture */}
        {gesture && gameStarted && (
          <p className="mt-2 text-2xl font-bold">{gesture}</p>
        )}

        {/* Result */}
        {result && (
          <p
            className={`mt-6 text-center text-2xl font-extrabold drop-shadow-xl animate-pulse ${
              result.includes("win")
                ? "text-green-400"
                : result.includes("Draw")
                ? "text-yellow-400"
                : "text-red-500"
            }`}
          >
            {result}
          </p>
        )}

        <button
          onClick={startGame}
          disabled={!isReady || countdown !== null}
          className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg disabled:bg-gray-600"
        >
          {isReady ? "Start Game" : "Loading..."}
        </button>

        <p className="text-sm mt-2">{statusText}</p>
      </div>
    </>
  );
}
