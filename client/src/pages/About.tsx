import { Navbar } from '@/components/layout/Navbar';

export function About() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Navbar title="About Us" showBackButton onBack={() => window.history.back()} />
      <main className="max-w-4xl mx-auto p-8">
        <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 shadow-lg">
          <h1 className="text-4xl font-bold text-amber-400 mb-6 text-center">Our Amazing Contributors</h1>
          <p className="text-lg text-slate-300 mb-8 text-center">
            This project is made possible by the hard work and dedication of many talented individuals. We are incredibly grateful for their contributions.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-700 p-6 rounded-lg text-center">
              <h2 className="text-2xl font-semibold text-amber-400">82deutschmark</h2>
              <p className="text-slate-400">Initial Concept & Core Development</p>
            </div>
            <div className="bg-slate-700 p-6 rounded-lg text-center">
              <h2 className="text-2xl font-semibold text-amber-400">neoneye</h2>
              <p className="text-slate-400">ARC-Interactive & Early Inspiration</p>
            </div>
            <div className="bg-slate-700 p-6 rounded-lg text-center">
              <h2 className="text-2xl font-semibold text-amber-400">Claude Code (Sonnet 4)</h2>
              <p className="text-slate-400">PlayFab Architecture & Documentation</p>
            </div>
            <div className="bg-slate-700 p-6 rounded-lg text-center">
              <h2 className="text-2xl font-semibold text-amber-400">Gemini 2.5 Pro</h2>
              <p className="text-slate-400">CloudScript Refactoring & Features</p>
            </div>
          </div>

          <div className="text-center mt-12">
            <a 
              href="https://github.com/neoneye/ARC-Interactive" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 transition-colors text-lg"
            >
              Learn more about the original ARC-Interactive project
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

export default About;
