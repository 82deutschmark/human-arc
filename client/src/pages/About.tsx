import { Navbar } from '@/components/layout/Navbar';

export function About() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Navbar title="About Us" showBackButton onBack={() => window.history.back()} />
      <main className="max-w-5xl mx-auto p-8">
        <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 shadow-lg">
          <h1 className="text-4xl font-bold text-amber-400 mb-6 text-center">Acknowledgements</h1>
          
          {/* Mark Barney Section */}
          <div className="mb-12">
            <h2 className="text-3xl font-semibold text-cyan-400 mb-4">The Creator</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              <div className="md:col-span-1 flex flex-col gap-4">
                <img src="https://markbarney.net/pictures/Mark%20and%20Yorkies%202.jpg" alt="Mark Barney with his Yorkies" className="rounded-lg shadow-lg" />
                <img src="https://markbarney.net/pictures/yorkies%20Maine.jpg" alt="Pawel and Pawleen" className="rounded-lg shadow-lg" />
              </div>
              <div className="md:col-span-2 bg-slate-700 p-6 rounded-lg">
                <h3 className="text-2xl font-bold text-amber-400">Mark Barney</h3>
                <p className="text-slate-300 mt-2">
                  Mark is an eccentric chicken farmer from eastern Connecticut who created this application. He lives on his hobby farm with his two beloved Yorkies, Pawel and Pawleen, and a lively flock of 30-40 chickens of various shapes and sizes.
                </p>
                <div className="mt-4 flex flex-wrap gap-4">
                  <a href="https://github.com/82deutschmark" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">GitHub</a>
                  <a href="https://markbarney.net" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">Website</a>
                  <a href="https://arc.gptpluspro.com" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">arc.gptpluspro.com (AI Data Source)</a>
                </div>
              </div>
            </div>
          </div>

          {/* Special Thanks Section */}
          <div className="mb-12">
            <h2 className="text-3xl font-semibold text-cyan-400 mb-4">Special Thanks</h2>
            <div className="bg-slate-700 p-6 rounded-lg">
              <h3 className="text-2xl font-bold text-amber-400">Simon Strandgaard (neoneye)</h3>
              <p className="text-slate-300 mt-2">
                Major thanks to Simon for all his help, support, and encouragement. His work has been a significant source of inspiration.
              </p>
              <div className="mt-4 flex flex-wrap gap-4">
                <a href="https://github.com/neoneye" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">GitHub</a>
                <a href="https://braingridgame.com/" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">BrainGridGame</a>
                <a href="https://github.com/neoneye/ARC-Interactive" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">ARC-Interactive Project</a>
              </div>
            </div>
          </div>

          {/* Community Section */}
          <div>
            <h2 className="text-3xl font-semibold text-cyan-400 mb-4">Community &amp; AI Contributors</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-slate-700 p-6 rounded-lg text-center">
                <h3 className="text-2xl font-semibold text-amber-400">ARC Discord Community</h3>
                <p className="text-slate-400 mt-2">For fostering a collaborative and innovative environment.</p>
                <a href="https://discord.gg/9b77dPAmcA" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline mt-4 inline-block">Join the Discord</a>
              </div>
              <div className="bg-slate-700 p-6 rounded-lg text-center">
                <h3 className="text-2xl font-semibold text-amber-400">Claude Code (Sonnet 4)</h3>
                <p className="text-slate-400 mt-2">PlayFab Architecture & Documentation</p>
              </div>
              <div className="bg-slate-700 p-6 rounded-lg text-center">
                <h3 className="text-2xl font-semibold text-amber-400">Gemini 2.5 Pro</h3>
                <p className="text-slate-400 mt-2">CloudScript Refactoring & Features</p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default About;
