'use client';

import { useEffect, useRef, useState } from 'react';
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import * as cam from '@mediapipe/camera_utils';
import * as handLandmarks from '@mediapipe/hands';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const getGesture = (landmarks: any): 'rock' | 'paper' | 'scissors' | null => {
  // Basic example: ganti ini sesuai logika deteksimu
  if (!landmarks) return null;
  // Tambahkan logika gesture sesungguhnya di sini
  return 'rock'; // placeholder
};

const GamePage = () => {
  const webcamRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [result, setResult] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [status, setStatus] = useState('Klik mulai untuk bermain!');
  const [camera, setCamera] = useState<cam.Camera | null>(null);

  // Preload Audio
  const sfx = useRef<Record<string, HTMLAudioElement>>({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sfx.current = {
        win: new Audio('/sfx/win.mp3'),
        lose: new Audio('/sfx/lose.mp3'),
        draw: new Audio('/sfx/draw.mp3'),
        detect: new Audio('/sfx/detect.mp3'),
      };
    }
  }, []);

  const playSFX = (key: string) => {
    const audio = sfx.current[key];
    if (audio) {
      audio.currentTime = 0;
      audio.play();
    }
  };

  const startGame = async () => {
    setGameStarted(true);
    setStatus('Mendeteksi gestur...');
    playSFX('detect');

    const hands = new Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    hands.onResults(async (results) => {
      const gesture = getGesture(results.multiHandLandmarks?.[0]);
      if (gesture) {
        const choices: ('rock' | 'paper' | 'scissors')[] = ['rock', 'paper', 'scissors'];
        const bot = choices[Math.floor(Math.random() * choices.length)];

        let outcome = '';
        if (gesture === bot) outcome = 'Draw';
        else if (
          (gesture === 'rock' && bot === 'scissors') ||
          (gesture === 'paper' && bot === 'rock') ||
          (gesture === 'scissors' && bot === 'paper')
        ) outcome = 'You Win!';
        else outcome = 'You Lose!';

        setResult(`Kamu: ${gesture} | Bot: ${bot} → ${outcome}`);
        playSFX(outcome === 'You Win!' ? 'win' : outcome === 'You Lose!' ? 'lose' : 'draw');
        setStatus('Klik mulai untuk bermain lagi!');
        setGameStarted(false);

        // Simpan skor ke Firebase
        try {
          await addDoc(collection(db, 'scores'), {
            playerGesture: gesture,
            botGesture: bot,
            result: outcome,
            timestamp: new Date()
          });
        } catch (err) {
          console.error('Gagal menyimpan skor:', err);
        }

        if (camera) camera.stop();
      }
    });

    if (webcamRef.current) {
      const newCam = new Camera(webcamRef.current, {
        onFrame: async () => {
          await hands.send({ image: webcamRef.current! });
        },
        width: 640,
        height: 480,
      });
      newCam.start();
      setCamera(newCam);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 mt-6">
      <video ref={webcamRef} className="hidden" autoPlay muted playsInline />
      <canvas ref={canvasRef} className="hidden" />
      <button
        onClick={startGame}
        disabled={gameStarted}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {gameStarted ? 'Mendeteksi gestur...' : 'Mulai'}
      </button>
      <p className="text-lg font-semibold">{status}</p>
      {result && <p className="text-xl mt-4">{result}</p>}
    </div>
  );
};

export default GamePage;
