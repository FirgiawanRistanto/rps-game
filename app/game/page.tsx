"use client";

import React, { useEffect, useRef, useState } from "react";
import { Hands, HAND_CONNECTIONS } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";
import * as cam from "@mediapipe/camera_utils";
import { db } from "../../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const preloadAudio = (src: string) => {
  const audio = new Audio(src);
  audio.load();
  return audio;
};

export default function Game() {
  const webcamRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [detecting, setDetecting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  // Preload audios
  const sfxDetect = useRef(preloadAudio("/sfx/detect.mp3"));
  const sfxWin = useRef(preloadAudio("/sfx/win.mp3"));
  const sfxLose = useRef(preloadAudio("/sfx/lose.mp3"));

  // Fungsi simpan skor ke Firestore
  const saveScoreToFirestore = async (scoreToSave: number) => {
    try {
      await addDoc(collection(db, "scores"), {
        score: scoreToSave,
        createdAt: serverTimestamp(),
      });
      console.log("Score saved:", scoreToSave);
    } catch (error) {
      console.error("Failed to save score:", error);
    }
  };

  // MediaPipe Hands instance dan Camera instance
  const handsRef = useRef<Hands | null>(null);
  const cameraRef = useRef<Camera | null>(null);

  // Fungsi process hasil deteksi tangan
  const onResults = (results: any) => {
    if (!canvasRef.current || !webcamRef.current) return;

    const canvasCtx = canvasRef.current.getContext("2d");
    if (!canvasCtx) return;

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    canvasCtx.drawImage(
      results.image,
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );

    // Gambarkan koneksi tangan
    if (results.multiHandLandmarks) {
      for (const landmarks of results.multiHandLandmarks) {
        for (const connection of HAND_CONNECTIONS) {
          const [startIdx, endIdx] = connection;
          const start = landmarks[startIdx];
          const end = landmarks[endIdx];
          canvasCtx.beginPath();
          canvasCtx.moveTo(
            start.x * canvasRef.current.width,
            start.y * canvasRef.current.height
          );
          canvasCtx.lineTo(
            end.x * canvasRef.current.width,
            end.y * canvasRef.current.height
          );
          canvasCtx.strokeStyle = "#00FF00";
          canvasCtx.lineWidth = 2;
          canvasCtx.stroke();
        }
        for (const landmark of landmarks) {
          canvasCtx.beginPath();
          canvasCtx.arc(
            landmark.x * canvasRef.current.width,
            landmark.y * canvasRef.current.height,
            5,
            0,
            2 * Math.PI
          );
          canvasCtx.fillStyle = "#FF0000";
          canvasCtx.fill();
        }
      }
    }

    canvasCtx.restore();

    // Contoh klasifikasi gesture sederhana (placeholder)
    // Kamu bisa ganti dengan logic klasifikasi gesture kamu
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      setResult("Gesture detected!");
      if (!detecting) {
        sfxDetect.current.play();
      }
      setDetecting(true);
    } else {
      setResult(null);
      setDetecting(false);
    }
  };

  useEffect(() => {
    if (!webcamRef.current || !canvasRef.current) return;

    handsRef.current = new Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });
    handsRef.current.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });
    handsRef.current.onResults(onResults);

    cameraRef.current = new Camera(webcamRef.current, {
      onFrame: async () => {
        if (handsRef.current && webcamRef.current) {
          await handsRef.current.send({ image: webcamRef.current });
        }
      },
      width: 640,
      height: 480,
    });
    cameraRef.current.start();

    return () => {
      cameraRef.current?.stop();
      handsRef.current?.close();
    };
  }, []);

  // Fungsi simpan skor saat tombol ditekan (contoh)
  const handleSaveScore = async () => {
    await saveScoreToFirestore(score);
    alert("Score disimpan ke Firebase!");
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Gesture RPS Game</h1>

      <video
        ref={webcamRef}
        className="border rounded-md"
        width="640"
        height="480"
        autoPlay
        muted
        playsInline
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0"
        width="640"
        height="480"
        style={{ position: "relative" }}
      />

      <div className="mt-4">
        <button
          onClick={() => {
            setScore((s) => s + 1);
            sfxWin.current.play();
          }}
          className="px-4 py-2 bg-green-500 text-white rounded-md mr-2"
        >
          Add Score +1 (Test)
        </button>

        <button
          onClick={handleSaveScore}
          className="px-4 py-2 bg-blue-600 text-white rounded-md"
        >
          Simpan Skor ke Firebase
        </button>
      </div>

      <div className="mt-4 text-lg font-semibold">
        {detecting ? "Mendeteksi Gesture..." : "Tidak ada gesture"}
      </div>

      <div className="mt-2 text-xl font-bold">{result}</div>
      <div className="mt-2 text-xl font-bold">Score: {score}</div>
    </div>
  );
}
