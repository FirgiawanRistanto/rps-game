"use client";

import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import Script from "next/script";
import { db } from "../../lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

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

  return (
    <>
      <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.min.js" strategy="beforeInteractive" />
      <div className="flex flex-col items-center min-h-screen bg-black text-white">
        <Webcam ref={webcamRef} mirrored className="w-72 rounded" />

        <p className="mt-4">Gesture: {gesture || "..."}</p>

        <button
          onClick={startDetection}
          disabled={!isReady}
          className="mt-4 px-4 py-2 bg-blue-600 rounded"
        >
          {isReady ? "Start Detection" : "Loading..."}
        </button>

        <p className="text-sm mt-2">{statusText}</p>
      </div>
    </>
  );
}
