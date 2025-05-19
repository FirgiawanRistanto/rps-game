'use client';
import Link from 'next/link';

export default function TutorialPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-800 to-purple-900 text-white px-6 py-8">
      <h1 className="text-4xl font-bold mb-6 animate-fade-in">📖 Tutorial Main Gesture RPS</h1>
      
      <div className="max-w-2xl bg-indigo-700 p-6 rounded-2xl shadow-lg space-y-4">
        <p className="text-lg">
          Selamat datang di <span className="font-bold text-yellow-300">Gesture RPS</span>! Di sini kamu bisa main suit (Rock Paper Scissors) pakai gestur tangan langsung di depan kamera. Caranya gampang banget:
        </p>

        <ul className="list-decimal pl-5 space-y-2 text-base">
          <li>Pastikan webcam kamu aktif & izinkan akses kamera.</li>
          <li>Klik tombol <span className="font-semibold text-yellow-300">Start Game</span> di halaman utama.</li>
          <li>Tunggu hitungan mundur 3 detik.</li>
          <li>Setelah muncul tulisan <span className="font-semibold text-yellow-300">"Mendeteksi Gestur..."</span>, arahkan tangan ke kamera.</li>
          <li>Lakukan salah satu gestur:
            <ul className="list-disc pl-5 mt-1">
              <li>✊ Rock: Semua jari dikepalkan.</li>
              <li>🖐️ Paper: Semua jari terbuka.</li>
              <li>✌️ Scissors: Hanya jari telunjuk & tengah terbuka.</li>
            </ul>
          </li>
          <li>Tunggu hasilnya muncul di layar. Skor otomatis tercatat.</li>
          <li>Kalau gerak sebelum countdown habis → <span className="text-red-400">💣 Meledak!</span></li>
        </ul>

        <p className="text-lg">
          Siap? Langsung mulai aja! 🎮
        </p>

        <div className="flex gap-4 pt-4">
          <Link href="/game" className="px-5 py-2 bg-white text-indigo-800 rounded-xl font-semibold hover:scale-105 transition">Start Game</Link>
          <Link href="/" className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition">Back to Home</Link>
        </div>
      </div>
    </main>
  );
}
