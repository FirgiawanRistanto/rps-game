"use client";

import { useEffect, useRef, useState } from "react";
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";
import * as tf from "@tensorflow/tfjs";
import { db } from "@/lib/firebase";
import { addDoc, collection } from "firebase/firestore";
import { classifyGesture } from "@/lib/gestures/gestureClassifier";

export default function GamePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handsRef = useRef<Hands | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const [gesture, setGesture] = useState("");
  const [aiGesture, setAiGesture] = useState("");
  const [result, setResult] = useState("");
  const [score, setScore] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [statusText, setStatusText] = useState("Klik mulai untuk bermain");

  const roundPlayedRef = useRef(false);
  const sfx = useRef<{ [key: string]: HTMLAudioElement }>({});

  useEffect(() => {
    if (typeof window === "undefined") return;

    sfx.current = {
      win: new Audio("/sfx/win.mp3"),
      lose: new Audio("/sfx/lose.mp3"),
      draw: new Audio("/sfx/draw.mp3"),
      countdown: new Audio("/sfx/countdown.mp3"),
      start: new Audio("/sfx/start.mp3"),
    };

    handsRef.current = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    handsRef.current.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.8,
      minTrackingConfidence: 0.8,
    });

    handsRef.current.onResults(onResults);

    const camera = new Camera(videoRef.current!, {
      onFrame: async () => {
        if (videoRef.current && videoRef.current.readyState === 4) {
          await handsRef.current?.send({ image: videoRef.current });
        }
      },
      width: 640,
      height: 480,
    });
    camera.start();

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      handsRef.current = null;
    };
  }, []);

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
          startDetectionLoop();
          return null;
        }
        return (prev ?? 1) - 1;
      });
    }, 1000);
  };

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

      rafIdRef.current = requestAnimationFrame(detect);
    };

    rafIdRef.current = requestAnimationFrame(detect);
  };

  const onResults = async (results: any) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (canvas && ctx && results.image) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    }

    if (
      results.multiHandLandmarks &&
      results.multiHandLandmarks.length > 0 &&
      !roundPlayedRef.current
    ) {
      const prediction = await classifyGesture(results.multiHandLandmarks[0]);
      setGesture(prediction);

      const options = ["rock", "paper", "scissors"];
      const random = options[Math.floor(Math.random() * 3)];
      setAiGesture(random);

      let outcome = "";
      if (prediction === random) {
        outcome = "draw";
        sfx.current.draw?.play();
      } else if (
        (prediction === "rock" && random === "scissors") ||
        (prediction === "paper" && random === "rock") ||
        (prediction === "scissors" && random === "paper")
      ) {
        outcome = "win";
        setScore((prev) => prev + 1);
        sfx.current.win?.play();
      } else {
        outcome = "lose";
        sfx.current.lose?.play();
      }

      setResult(outcome);
      setStatusText(`Kamu ${outcome}!`);
      setGameStarted(false);
      roundPlayedRef.current = true;

      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    }
  };

  const saveScore = async () => {
    try {
      await addDoc(collection(db, "scores"), {
        name: "Player",
        score,
        timestamp: new Date(),
      });
      alert("Skor disimpan!");
    } catch (err) {
      alert("Gagal menyimpan skor");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white">
      <h1 className="text-3xl font-bold mb-4">Suit Gesture Game</h1>
      <div className="relative w-[640px] h-[480px] border rounded overflow-hidden">
        <video ref={videoRef} className="absolute w-full h-full" autoPlay playsInline muted />
        <canvas ref={canvasRef} width={640} height={480} className="absolute" />
      </div>

      <p className="mt-4 text-lg font-medium">{statusText}</p>
      {countdown !== null && <p className="text-4xl font-bold my-2">{countdown}</p>}

      <div className="my-4 flex flex-col gap-2 items-center">
        <button
          onClick={startGame}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Mulai
        </button>
        <button
          onClick={saveScore}
          className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Simpan Skor
        </button>
      </div>

      <div className="text-center mt-4">
        <p>Gesture kamu: <strong>{gesture}</strong></p>
        <p>Gesture AI: <strong>{aiGesture}</strong></p>
        <p>Hasil: <strong>{result}</strong></p>
        <p className="mt-2">Skor: <strong>{score}</strong></p>
      </div>
    </div>
  );
}
