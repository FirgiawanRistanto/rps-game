'use client';
import Link from 'next/link';

export default function TutorialPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen arcade-bgg text-white px-6 py-8">
      <h1 className="text-5xl font-extrabold mb-6 animate-fade-in arcade-title">
        📖 Tutorial Main Gesture RPS
      </h1>
      
      <div className="max-w-2xl bg-indigo-800/60 p-6 rounded-3xl border-4 border-pink-500 shadow-[0_0_25px_5px_rgba(255,0,200,0.5)] space-y-5">
        <p className="text-lg arcade-desc">
          Selamat datang di <span className="font-bold text-yellow-300">Gesture RPS</span>!  
          Di sini kamu bisa main suit (Rock Paper Scissors) pakai gestur tangan langsung di depan kamera. Caranya gampang banget:
        </p>

        <ul className="list-decimal pl-5 space-y-2 text-base text-white/90">
          <li>Pastikan webcam kamu aktif & izinkan akses kamera.</li>
          <li>Klik tombol <span className="font-semibold text-yellow-300">Start Game</span> di halaman utama.</li>
          <li>Tunggu hitungan mundur 3 detik.</li>
          <li>Lakukan salah satu gestur:
            <ul className="list-disc pl-5 mt-1 text-white/90">
              <li>✊ Rock: Semua jari dikepalkan.</li>
              <li>🖐️ Paper: Semua jari terbuka.</li>
              <li>✌️ Scissors: Hanya jari telunjuk & tengah terbuka.</li>
            </ul>
          </li>
          <li>Tunggu hasilnya muncul di layar. Skor otomatis tercatat.</li>
        </ul>

        <p className="text-lg arcade-desc">Gampang banget kan?! Gas cobain main! 🎮</p>

        <div className="flex gap-4 pt-4">
          <Link href="/" className="px-6 py-3 bg-gradient-to-b from-yellow-300 to-yellow-500 text-indigo-900 font-extrabold rounded-2xl shadow-[0_0_10px_rgba(255,255,0,0.7)] hover:scale-105 transition">
            ⬅️ Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
