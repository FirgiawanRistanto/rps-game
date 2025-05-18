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

  const roundPlayedRef = useRef(false);
  const handsRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const sfx = useRef<any>({});

  useEffect(() => {
    // Inisialisasi Audio hanya di client
    if (typeof window !== "undefined") {
      sfx.current = {
        countdown: new Audio("/sfx/countdown.mp3"),
        detect: new Audio("/sfx/detect.mp3"),
        win: new Audio("/sfx/win.mp3"),
        lose: new Audio("/sfx/lose.mp3"),
        draw: new Audio("/sfx/draw.mp3"),
        save: new Audio("/sfx/save.mp3"),
      };
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (window.Hands && webcamRef.current) {
        clearInterval(interval);

        const hands = new window.Hands({
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
          if (
            results.multiHandLandmarks &&
            results.multiHandLandmarks.length > 0 &&
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

        handsRef.current = hands;
        videoRef.current = webcamRef.current.video;
        setIsModelReady(true);
        setStatusText("Model ready.");
        startDetectionLoop();
      }
    }, 100);

    return () => {
      handsRef.current = null;
    };
  }, [gameStarted]); // dependensi diperbaiki

  const startDetectionLoop = () => {
    const detect = async () => {
      if (
        handsRef.current &&
        videoRef.current &&
        videoRef.current.readyState === 4 &&
        gameStarted &&
        !roundPlayedRef.current
      ) {
        await handsRef.current.send({ image: videoRef.current });
      }
      requestAnimationFrame(detect);
    };
    requestAnimationFrame(detect);
  };

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
  };

  const startGame = () => {
    setCountdown(3);
    setGesture("");
    setResult("");
    roundPlayedRef.current = false;
    setStatusText("Get ready...");

    const interval = setInterval(() => {
      setCountdown((prev) => {
        sfx.current.countdown?.play();
        if (prev === 1) {
          clearInterval(interval);
          setCountdown(null);
          setGameStarted(true);
          setStatusText("Mendeteksi gestur...");
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
      alert("Skor berhasil disimpan!");
    } catch (err) {
      alert("Gagal menyimpan skor.");
      console.error(err);
    }
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
            disabled={!isModelReady || gameStarted}
            className="px-6 py-2 mt-4 bg-blue-500 hover:bg-blue-700 rounded-lg transition disabled:bg-gray-600"
          >
            {isModelReady ? "Mulai" : "Loading Model..."}
          </button>
        )}

        <p className="mt-4 text-sm text-gray-300">{statusText}</p>

        {result && (
          <p className="mt-6 text-lg text-green-400 font-semibold">{result}</p>
        )}

        <button
          onClick={handleSaveScore}
          className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg"
        >
          Simpan Skor ke Firebase
        </button>
      </div>
    </>
  );
}
