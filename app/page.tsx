export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen arcade-bg text-white px-4">
      <img
        src="/logo.jpg"
        alt="Logo"
        className="w-50 mb-4 animate-bounce rounded-2xl shadow-lg border-4 border-yellow-300 glow-logo"
      />
      <h1 className="text-6xl font-extrabold mb-6 animate-fade-inn arcade-title">
        Gesture RPS
      </h1>
      <p className="text-center mb-8 max-w-md text-xl arcade-desc">
        Main Gunting Batu Kertas pakai tanganmu secara real-time! Pilih menu di bawah, bro!
      </p>

      <div className="flex gap-6 animate-bounce-in">
        <a
          href="/game"
          className="px-8 py-4 bg-gradient-to-b from-yellow-400 to-red-500 text-indigo-900 rounded-full font-extrabold text-lg border-4 border-yellow-300 hover:scale-110 hover:brightness-110 transition duration-300 shadow-lg arcade-glow"
        >
          Start Game
        </a>

        <a
          href="/tutorial"
          className="px-8 py-4 bg-gradient-to-b from-pink-600 to-purple-800 text-yellow-200 rounded-full font-extrabold text-lg border-4 border-pink-400 hover:scale-110 hover:brightness-110 transition duration-300 shadow-lg arcade-glow"
        >
          Tutorial
        </a>
      </div>
    </main>
  );
}
