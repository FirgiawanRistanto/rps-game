
// components/GamePageContent.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
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

export default function GamePageContent() {
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
  const [errorMsg, setErrorMsg] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [playerName, setPlayerName] = useState("");


  const handleUploadScore = () => {
    setShowModal(true);
  };

  const submitScore = async () => {
    if (!playerName.trim()) {
      setErrorMsg("⚠️ Nama gak boleh kosong bro!");
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }

    const res = await fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: playerName,
        win: score.player,
        lose: score.ai,
      }),
    });

    const data = await res.json();

    if (data.error) {
      setErrorMsg("Upload gagal: " + data.error);
    } else {
      setErrorMsg("");
      alert("Skor berhasil diupload bro! 🔥");
      setScore({ player: 0, ai: 0 });
      setResult("");
      setShowModal(false);
      setPlayerName("");
    }
  };

  useEffect(() => {
    isActiveRef.current = true;
    let timeout: any;

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

      clearTimeout(timeout); // kalau udah ready, matikan timeout-nya

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

    // 🚨 Timeout 5 detik kalau model gak ready, reload halaman
    timeout = setTimeout(() => {
      console.warn("Model belum ready, reload page...");
      window.location.reload();
    }, 5000);

    return () => {
      isActiveRef.current = false;
      clearTimeout(timeout);
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
    isDetectingRef.current = false;

    const interval = setInterval(() => {
      sfxRef.current.countdown?.play();
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(interval);
          setCountdown(null);
          setGameStarted(true);
          isDetectingRef.current = true;
          return null;
        }
        return (prev ?? 1) - 1;
      });
    }, 1000);
  };

  const triggerConfetti = () => {
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
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
      <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.min.js" strategy="beforeInteractive" />
      <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.min.js" strategy="beforeInteractive" />



      <div className="arcade-bg flex flex-col items-center justify-center min-h-screen p-4 text-white relative">
        {/* Tombol Main Menu */}
        <div className="fixed top-13 left-4 z-50">
          <Link
            href="/"
            className="bg-yellow-400 text-black px-4 py-2 rounded-xl shadow-md hover:bg-yellow-300 transition-colors font-bold arcade-buttonn text-sm"
          >
            Main Menu
          </Link>
        </div>

        {/* Tombol Leaderboard */}
        <div className="fixed top-13 right-4 z-50">
          <Link href="/leaderboard">
            <img
              src="/leaderboard.png"
              alt="Leaderboard"
              className="w-10 h-10 hover:scale-110 transition duration-200"
            />
          </Link>
        </div>

        {/* Modal untuk input nama */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
            <div className="bg-gradient-to-b from-yellow-400 to-red-500 p-6 rounded-2xl shadow-2xl text-center arcade-glow w-80 animate-bounce-in">
              <h2 className="text-2xl font-bold text-indigo-900 mb-4">Masukin Nama Bro!</h2>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Nama kamu..."
                className="w-full p-3 rounded-xl text-black font-bold text-center border-2 border-yellow-300 focus:outline-none focus:ring-4 focus:ring-yellow-400 mb-4"
              />
              <div className="flex gap-3 justify-center">
                <button
                  onClick={submitScore}
                  className="px-4 py-2 bg-indigo-900 text-yellow-300 rounded-xl font-bold hover:scale-110 transition arcade-button text-sm"
                >
                  Upload
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-800 text-white rounded-xl font-bold hover:scale-110 transition text-sm"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pesan error */}{errorMsg && (
          <div className="fixed top-5 inset-x-0 flex justify-center z-50">
            <div className="bg-red-600 text-white px-5 py-3 rounded-xl shadow-lg text-center arcade-glow animate-bounce-in border-4 border-yellow-300">
              {errorMsg}
            </div>
          </div>
        )}


        <div className="arcade-content flex flex-col items-center justify-center w-full max-w-md p-6">
          <Webcam
            ref={webcamRef}
            mirrored
            className="rounded-lg shadow-lg w-full max-w-md game-webcam"
          />

          <div className="flex justify-center items-center mt-4">
            <p
              className={`mt-4 gesture-display font-extrabold text-center text-lg md:text-2xl 
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
              className="arcade-button mt-6 disabled:opacity-50 text-lg md:text-2xl"
            >
              {isModelReady ? "Start Game" : "Loading..."}
            </button>
          )}

          <button
            onClick={handleUploadScore}
            className="arcade-button mt-4 bg-green-600 hover:bg-green-700 transition"
          >
            Upload Score
          </button>

        </div>
      </div>
    </>
  );
}
