'use client';
import { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import Script from 'next/script';
import { classifyGesture } from '@/lib/gestures/gestureClassifier';

declare global {
  interface Window {
    Hands: any;
    Camera: any;
  }
}

let hands: any;

export default function GamePage() {
  const webcamRef = useRef<Webcam>(null);
  const sfxRef = useRef({
    countdown: typeof Audio !== 'undefined' ? new Audio('/sfx/countdown.mp3') : null,
    detect: typeof Audio !== 'undefined' ? new Audio('/sfx/detect.mp3') : null,
    win: typeof Audio !== 'undefined' ? new Audio('/sfx/win.mp3') : null,
    lose: typeof Audio !== 'undefined' ? new Audio('/sfx/lose.mp3') : null,
    draw: typeof Audio !== 'undefined' ? new Audio('/sfx/draw.mp3') : null,
  });

  const [gesture, setGesture] = useState('');
  const [score, setScore] = useState({ player: 0, ai: 0 });
  const [result, setResult] = useState('');
  const [isModelReady, setIsModelReady] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showDetectingModal, setShowDetectingModal] = useState(false);
  const [showBombModal, setShowBombModal] = useState(false);

  const roundPlayedRef = useRef(false);
  const isActiveRef = useRef(true);

  useEffect(() => {
    isActiveRef.current = true;

    const init = async () => {
      if (!webcamRef.current || typeof window === 'undefined') return;
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

      hands = new window.Hands({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.9.3/${file}`,
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 0,
        minDetectionConfidence: 0.75,
        minTrackingConfidence: 0.75,
      });

      hands.onResults(onResultsHandler);

      setIsModelReady(true);
    };

    init();

    return () => {
      isActiveRef.current = false;
    };
  }, []);

  const onResultsHandler = (results: any) => {
    if (
      results.multiHandLandmarks &&
      results.multiHandLandmarks.length > 0 &&
      isActiveRef.current
    ) {
      const landmarks = results.multiHandLandmarks[0];
      const detectedGesture = classifyGesture(landmarks);

      // Deteksi saat countdown masih jalan = ledak
      if (countdown !== null) {
        setShowBombModal(true);
        isActiveRef.current = false;
        return;
      }

      // Normal detect saat gameStarted true
      if (gameStarted && !roundPlayedRef.current && detectedGesture !== 'unknown') {
        sfxRef.current.detect?.play();
        setGesture(detectedGesture);
        playRound(detectedGesture);
        roundPlayedRef.current = true;
        setGameStarted(false);
        setShowDetectingModal(false);
        setShowResultModal(true);
      }
    }
  };

  const startDetection = () => {
    const video = webcamRef.current?.video;
    if (!video) return;

    const processFrame = async () => {
      if (video && isActiveRef.current) {
        await hands.send({ image: video });
        requestAnimationFrame(processFrame);
      }
    };

    requestAnimationFrame(processFrame);
  };

  const playRound = (playerMove: string) => {
    const moves = ['rock', 'paper', 'scissors'];
    const aiMove = moves[Math.floor(Math.random() * 3)];

    let outcome = '';
    if (playerMove === aiMove) {
      outcome = 'Draw';
      sfxRef.current.draw?.play();
    } else if (
      (playerMove === 'rock' && aiMove === 'scissors') ||
      (playerMove === 'paper' && aiMove === 'rock') ||
      (playerMove === 'scissors' && aiMove === 'paper')
    ) {
      outcome = 'You win!';
      sfxRef.current.win?.play();
      setScore((s) => ({ ...s, player: s.player + 1 }));
    } else {
      outcome = 'AI wins!';
      sfxRef.current.lose?.play();
      setScore((s) => ({ ...s, ai: s.ai + 1 }));
    }

    setResult(`${playerMove} vs ${aiMove} → ${outcome}`);
  };

  const startGame = () => {
    setCountdown(3);
    setGesture('');
    setResult('');
    setShowResultModal(false);
    setShowDetectingModal(false);
    setShowBombModal(false);
    roundPlayedRef.current = false;
    isActiveRef.current = true;

    const interval = setInterval(() => {
      sfxRef.current.countdown?.play();
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(interval);
          setCountdown(null);
          setGameStarted(true);
          setShowDetectingModal(true);
          startDetection();
          return null;
        }
        return (prev ?? 1) - 1;
      });
    }, 1000);
  };

  return (
    <>
      <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.9.3/hands.min.js" strategy="beforeInteractive" />
      <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.min.js" strategy="beforeInteractive" />

      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
        <Webcam ref={webcamRef} mirrored className="rounded-lg shadow-lg w-full max-w-md" />
        <h2 className="mt-4 text-yellow-400 text-2xl font-bold">Detected Gesture: {gesture || '...'}</h2>
        <p className="mt-2">Score: You {score.player} - AI {score.ai}</p>

        {countdown !== null ? (
          <p className="text-3xl text-red-500 font-bold mb-2 animate-pulse">Get Ready... {countdown}</p>
        ) : (
          <button
            onClick={startGame}
            disabled={!isModelReady}
            className="px-6 py-2 mt-4 bg-blue-500 hover:bg-blue-700 rounded-lg transition disabled:bg-gray-600"
          >
            {isModelReady ? 'Start Game' : 'Loading Model...'}
          </button>
        )}

        {/* Modal hasil */}
        {showResultModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={() => setShowResultModal(false)}>
            <div className="bg-gray-800 p-6 rounded-lg max-w-sm w-full text-center">
              <h3 className="text-xl font-bold mb-4">Round Result</h3>
              <p className="mb-6 text-lg">{result}</p>
              <button onClick={() => setShowResultModal(false)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white">Close</button>
            </div>
          </div>
        )}

        {/* Modal deteksi */}
        {showDetectingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 animate-pulse">
            <div className="bg-gray-900 p-6 rounded-lg text-center">
              <h2 className="text-lg font-semibold">Mendeteksi gestur...</h2>
              <p className="text-sm text-gray-300 mt-2">Arahkan tanganmu ke kamera</p>
            </div>
          </div>
        )}

        {/* Modal bom */}
        {showBombModal && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50">
            <div className="text-8xl animate-ping mb-4">💣</div>
            <h2 className="text-red-500 text-3xl font-bold glitch">Nah kan MELEDAK!</h2>
            <p className="text-gray-300 mt-4 text-lg">Silakan refresh halaman ini 🚀</p>
          </div>
        )}
      </div>
    </>
  );
}
