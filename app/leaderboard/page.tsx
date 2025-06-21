"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

interface Score {
  id: string;
  name: string;
  win: number;
  lose: number;
}

export default function LeaderboardPage() {
  const [scores, setScores] = useState<Score[]>([]);

  useEffect(() => {
    const fetchScores = async () => {
      const { data, error } = await supabase
        .from("leaderboard")
        .select("*")
        .order("win", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetch leaderboard: ", error);
      } else {
        setScores(data || []);
      }
    };

    fetchScores();
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen arcade-bg text-white px-4 py-8">
      <h1 className="text-5xl font-extrabold mb-6 arcade-glow animate-glitch">🏆 Leaderboard</h1>

      {scores.length > 0 ? (
        <div className="w-full max-w-lg space-y-4">
          {scores.map((score, index) => (
            <div
              key={score.id}
              className="flex items-center justify-between px-6 py-4 bg-black bg-opacity-40 rounded-2xl border-2 border-pink-500 shadow-lg text-yellow-300 font-bold arcade-score animate-bounce-in"
            >
              <span className="text-xl">{index + 1}. {score.name}</span>
              <span className="text-xl">🎮 {score.win} pts</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xl mt-6 text-yellow-200">Belum ada skor bro — gas main duluan! 🎮🔥</p>
      )}

      <Link href="/" className="mt-6 arcade-button leaderboard-button">
        Kembali ke Menu Utama
      </Link>
    </main>
  );
}
