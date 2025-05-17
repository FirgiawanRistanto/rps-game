export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-800 to-purple-900 text-white px-4">
      <h1 className="text-5xl font-bold mb-4 animate-fade-in">Gesture RPS</h1>
      <p className="text-center mb-6 max-w-md text-lg">Play Rock Paper Scissors using hand gestures in real-time. Choose your mode below!</p>
      <div className="flex gap-4">
        <a href="/game" className="px-6 py-3 bg-white text-indigo-800 rounded-2xl font-semibold hover:scale-105 transition">Start Game</a>
        <a href="/tutorial" className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-semibold hover:bg-indigo-700 transition">Tutorial</a>
      </div>
    </main>
  );
}