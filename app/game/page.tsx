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
  const [scoreAnim, setScoreAnim] = useState(false);
  const isDetectingRef = useRef(false);

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
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
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
          isDetectingRef.current &&
          !roundPlayedRef.current
        ) {
          const landmarks = results.multiHandLandmarks[0];
          const detectedGesture = classifyGesture(landmarks);
          const stableGesture = smoothGesture(detectedGesture);

          if (stableGesture !== "unknown") {
            setGesture(stableGesture);
            playRound(stableGesture);
            roundPlayedRef.current = true;
            isDetectingRef.current = false; // stop detection sampe game mulai lagi
            setGameStarted(false);
          }
        }
      });


      const processFrame = async () => {
        if (
          isActiveRef.current &&
          video &&
          video.readyState === 4 &&
          video.videoWidth > 0 &&
          video.videoHeight > 0
        ) {
          try {
            await hands.send({ image: video });
          } catch (err) {
            console.error("Error sending frame:", err);
          }
        }
        if (isActiveRef.current) {
          requestAnimationFrame(processFrame);
        }
      };

      requestAnimationFrame(processFrame);
    };

    init();

    // handle tab switch
    const onVisibilityChange = () => {
      isActiveRef.current = !document.hidden;
      if (!document.hidden) {
        requestAnimationFrame(() => {
          if (webcamRef.current?.video?.readyState === 4) {
            isActiveRef.current = true;
          }
        });
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      isActiveRef.current = false;
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [gameStarted]);

  useEffect(() => {
    if (scoreAnim) {
      const timeout = setTimeout(() => {
        setScoreAnim(false);
      }, 400);
      return () => clearTimeout(timeout);
    }
  }, [scoreAnim]);

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

    setResult(`${playerMove} vs ${aiMove}  ${outcome}`);
  };

  const startGame = () => {
    setCountdown(3);
    setGesture("");
    setResult("");
    roundPlayedRef.current = false;
    resetGestureHistory();
    isDetectingRef.current = false; // pastikan detection off dulu

    const interval = setInterval(() => {
      sfxRef.current.countdown?.play();
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(interval);
          setCountdown(null);
          setGameStarted(true);
          isDetectingRef.current = true; // aktifkan detection pas countdown habis
          return null;
        }
        return (prev ?? 1) - 1;
      });
    }, 1000);
  };


  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
    });
  };

  const triggerGlitch = () => {
    document.body.classList.add("glitch");
    setTimeout(() => {
      document.body.classList.remove("glitch");
    }, 500);
  };

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
            className="rounded-lg shadow-lg w-full max-w-md game-webcam"
          />

          <div className="flex justify-center items-center mt-4">
            <p
              className={`mt-4 gesture-display text-5xl font-extrabold text-center 
                ${result.includes("Win")
                  ? "text-yellow-400 animate-glitch"
                  : result.includes("Lose")
                    ? "text-red-500 animate-shake"
                    : result.includes("Draw")
                      ? "text-white animate-pulse"
                      : ""
                }`}
            >
              {result}
            </p>
          </div>

          <p className={`arcade-score ${scoreAnim ? "bounce" : ""}`}>
            Score: You {score.player} - AI {score.ai}
          </p>

          {countdown !== null ? (
            <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
              <p className="text-8xl font-extrabold text-yellow-400 arcade-glow animate-countdown">
                {countdown}
              </p>
            </div>
          ) : (
            <button
              onClick={startGame}
              className="arcade-button mt-6 disabled:opacity-50"
            >
              {isModelReady ? "Start Game" : "Loading..."}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
