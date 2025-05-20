"use client";
import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import Script from "next/script";
import confetti from "canvas-confetti";
import { classifyGesture } from "@/lib/gestures/gestureClassifier";
import { smoothGesture, resetGestureHistory } from "@/lib/gestures/smoothing";

declare global {
  interface Window {
    Hands: any;
    Camera: any;
  }
}

export default function GamePage() {
  const webcamRef = useRef<Webcam>(null);
  const sfxRef = useRef({
    countdown: typeof Audio !== "undefined" ? new Audio("/sfx/countdown.mp3") : null,
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

    const init = async () => {
      if (!webcamRef.current || typeof window === "undefined") return;
      const video = webcamRef.current.video;

      const waitUntilVideoReady = () =>
        new Promise<void>((resolve) => {
          const check = () => {
            if (video && video.readyState === 4) resolve();
            else requestAnimationFrame(check);
          };
          check();
        });

      await waitUntilVideoReady();

      const handsReady = () =>
        new Promise<void>((resolve) => {
          const check = () => {
            if (window.Hands && window.Camera) resolve();
            else setTimeout(check, 50);
          };
          check();
        });

      await handsReady();

      const hands = new window.Hands({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 0,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7,
      });

      hands.onResults((results: any) => {
        setIsModelReady(true);

        if (
          results.multiHandLandmarks &&
          results.multiHandLandmarks.length > 0 &&
          isActiveRef.current &&
          gameStarted &&
          !roundPlayedRef.current
        ) {
          const landmarks = results.multiHandLandmarks[0];
          const detectedGesture = classifyGesture(landmarks);

          const stableGesture = smoothGesture(detectedGesture);

          if (stableGesture !== "unknown") {
            setGesture(stableGesture);
            playRound(stableGesture);
            roundPlayedRef.current = true;
            setGameStarted(false);
          }
        }
      });

      const processFrame = async () => {
        if (video && isActiveRef.current) {
          await hands.send({ image: video });
          requestAnimationFrame(processFrame);
        }
      };

      requestAnimationFrame(processFrame);
    };

    init();

    return () => {
      isActiveRef.current = false;
    };
  }, [gameStarted]);

  const playRound = (playerMove: string) => {
    const moves = ["✊", "🖐️", "✌️"];
    const aiMove = moves[Math.floor(Math.random() * moves.length)];

    let outcome = "";
    if (playerMove === aiMove) {
      outcome = "Draw";
      sfxRef.current.draw?.play();
      triggerSparkle();
    } else if (
      (playerMove === "✊" && aiMove === "✌️") ||
      (playerMove === "🖐️" && aiMove === "✊") ||
      (playerMove === "✌️" && aiMove === "🖐️")
    ) {
      outcome = "You Win!";
      sfxRef.current.win?.play();
      triggerConfetti();
      setScore((s) => ({ ...s, player: s.player + 1 }));
    } else {
      outcome = "You Lose!";
      sfxRef.current.lose?.play();
      triggerGlitch();
      setScore((s) => ({ ...s, ai: s.ai + 1 }));
    }

    setResult(`${playerMove} vs ${aiMove} → ${outcome}`);
  };

  const startGame = () => {
    setCountdown(3);
    setGesture("");
    setResult("");
    roundPlayedRef.current = false;
    resetGestureHistory();

    const interval = setInterval(() => {
      sfxRef.current.countdown?.play();
      setCountdown((prev) => {
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

  // ✨ Confetti efek
  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
    });
  };

  // 💥 Glitch efek
  const triggerGlitch = () => {
    document.body.classList.add("glitch");
    setTimeout(() => {
      document.body.classList.remove("glitch");
    }, 500);
  };

  // 🌟 Sparkle efek
  const triggerSparkle = () => {
    confetti({
      particleCount: 50,
      spread: 50,
      origin: { y: 0.5 },
      colors: ["#ffffff", "#ffd700"],
    });
  };

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.min.js"
        strategy="beforeInteractive"
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.min.js"
        strategy="beforeInteractive"
      />

      <div className="arcade-bg flex flex-col items-center justify-center min-h-screen p-4 text-white">
        <div className="arcade-content">
          <Webcam
            ref={webcamRef}
            mirrored
            className="rounded-lg shadow-lg w-full max-w-md"
          />

          <div className="flex justify-center items-center mt-4">
            <div
              className={`gesture-display text-6xl ${
                gesture === "✊"
                  ? "text-red-500"
                  : gesture === "🖐️"
                  ? "text-green-500"
                  : gesture === "✌️"
                  ? "text-blue-500"
                  : ""
              }`}
            >
              {gesture}
            </div>
          </div>
          <p className="mt-2">
            Score: You {score.player} - AI {score.ai}
          </p>

          {countdown !== null ? (
            <p className="text-3xl text-red-500 font-bold mb-2 animate-pulse">
              {countdown}
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
          <p className="mt-4 gesture-display text-5xl">{result}</p>
        </div>
      </div>
    </>
  );
}
