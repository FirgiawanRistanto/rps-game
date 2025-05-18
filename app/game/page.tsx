"use client";

import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import Script from "next/script";
import { db } from "../../lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

declare global {
  interface Window {
    Hands: any;
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
  const [statusText, setStatusText] = useState("Loading model...");

  const handsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const roundPlayedRef = useRef(false);

  const sfx = useRef({
    countdown: typeof Audio !== "undefined" ? new Audio("/sfx/countdown.mp3") : null,
    detect: typeof Audio !== "undefined" ? new Audio("/sfx/detect.mp3") : null,
    win: typeof Audio !== "undefined" ? new Audio("/sfx/win.mp3") : null,
    lose: typeof Audio !== "undefined" ? new Audio("/sfx/lose.mp3") : null,
    draw: typeof Audio !== "undefined" ? new Audio("/sfx/draw.mp3") : null,
    save: typeof Audio !== "undefined" ? new Audio("/sfx/save.mp3") : null,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      if (window.Hands && window.Camera && webcamRef.current) {
        clearInterval(interval);

        const hands = new window.Hands({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 0,
          minDetectionConfidence: 0.85,
          minTrackingConfidence: 0.85,
        });

        hands.onResults((results: any) => {
          if (
            results.multiHandLandmarks?.length &&
            gameStarted &&
            !roundPlayedRef.current
          ) {
            const gestureName = classifyGesture(results.multiHandLandmarks[0]);
            if (gestureName) {
              sfx.current.detect?.play();
              setGesture(gestureName);
              playRound(gestureName);
              roundPlayedRef.current = true;
              setGameStarted(false);
              setStatusText("Match result ready.");
            }
          }
        });

        const video = webcamRef.current.video;

        const camera = new window.Camera(video, {
          onFrame: async () => {
            if (gameStarted && !roundPlayedRef.current) {
              await hands.send({ image: video });
            }
          },
          width: 640,
          height: 480,
        });

        handsRef.current = hands;
        cameraRef.current = camera;
        camera.start();
        setIsModelReady(true);
        setStatusText("Model ready.");
      }
    }, 100);

    return () => {
      clearInterval(interval);
      handsRef.current = null;
      cameraRef.current?.stop();
    };
  }, []);

  const classifyGesture = (landmarks: any[]) => {
    const [index, middle, ring, pinky] = [8, 12, 16, 20].map(i => landmarks[i].y);
    const [iBase, mBase, rBase, pBase] = [6, 10, 14, 18].map(i => landmarks[i].y);

    const isFist = index > iBase && middle > mBase && ring > rBase && pinky > pBase;
    const isOpenPalm = index < iBase && middle < mBase && ring < rBase && pinky < pBase;
    const isScissors = index < iBase && middle < mBase && ring > rBase && pinky > pBase;

    return isFist ? "rock" : isOpenPalm ? "paper" : isScissors ? "scissors" : "";
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
      setScore(s => ({ ...s, player: s.player + 1 }));
    } else {
      outcome = "AI wins!";
      sfx.current.lose?.play();
      setScore(s => ({ ...s, ai: s.ai + 1 }));
    }

    setResult(`${playerMove} vs ${aiMove} → ${outcome}`);
  };

  const startGame = () => {
    setCountdown(3);
    setGesture("");
    setResult("");
    roundPlayedRef.current = false;
    setStatusText("Get ready...");

    const interval = setInterval(() => {
      setCountdown(prev => {
        sfx.current.countdown?.play();
        if (prev === 1) {
          clearInterval(interval);
          setCountdown(null);
          setGameStarted(true);
          setStatusText("Detecting gesture...");
          return null;
        }
        return (prev ?? 1) - 1;
      });
    }, 1000);
  };

  const handleSaveScore = async () => {
    try {
      await addDoc(collection(db, "scores"), {
        player: score.player,
        ai: score.ai,
        createdAt: serverTimestamp(),
      });
      sfx.current.save?.play();
      alert("Score saved!");
    } catch (err) {
      console.error(err);
      alert("Failed to save score.");
    }
  };

  return (
    <>
      <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.min.js" strategy="beforeInteractive" />
      <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.min.js" strategy="beforeInteractive" />
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
        <Webcam ref={webcamRef} mirrored className="rounded-lg shadow-lg w-full max-w-md" />

        <h2 className="mt-4 text-yellow-400 text-2xl font-bold">Gesture: {gesture || "..."}</h2>
        <p className="mt-2">Score: You {score.player} - AI {score.ai}</p>

        {countdown !== null ? (
          <p className="text-3xl text-red-500 font-bold mb-2 animate-pulse">Get Ready... {countdown}</p>
        ) : (
          <button
            onClick={startGame}
            disabled={!isModelReady || gameStarted}
            className="px-6 py-2 mt-4 bg-blue-500 hover:bg-blue-700 rounded-lg transition disabled:bg-gray-600"
          >
            {isModelReady ? "Start" : "Loading Model..."}
          </button>
        )}

        <p className="mt-4 text-sm text-gray-300">{statusText}</p>

        {result && <p className="mt-6 text-lg text-green-400 font-semibold">{result}</p>}

        <button onClick={handleSaveScore} className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg">Save Score</button>
      </div>
    </>
  );
}
