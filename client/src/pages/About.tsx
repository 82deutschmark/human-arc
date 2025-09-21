/*
 *
 * Author: Cascade using Gemini 2.5 Pro
 * Date: 2025-09-21T19:23:05-04:00
 * PURPOSE: Redesigned About page to match serious research platform aesthetic while preserving all content. Features professional typography, clean layout, academic color scheme, and improved visual hierarchy.
 * SRP and DRY check: Pass - This file handles only the About page presentation and doesn't duplicate functionality from other components.
 *
 */
import { Navbar } from '@/components/layout/Navbar';

export function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 text-slate-900">
      <Navbar title="About Us" showBackButton onBack={() => window.history.back()} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            About the Project
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            A comprehensive research platform dedicated to advancing artificial intelligence through
            rigorous testing, collaborative development, and innovative problem-solving.
          </p>
        </div>

        <div className="space-y-16">
          {/* Project Leadership Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-8 py-6">
              <h2 className="text-3xl font-bold text-white">Project Leadership</h2>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1 flex flex-col gap-6">
                  <img
                    src="https://markbarney.net/pictures/Mark%20and%20Yorkies%202.jpg"
                    alt="Mark Barney with his Yorkies"
                    className="rounded-xl shadow-md border border-slate-200"
                  />
                  <img
                    src="https://markbarney.net/pictures/yorkies%20Maine.jpg"
                    alt="Pawel and Pawleen"
                    className="rounded-xl shadow-md border border-slate-200"
                  />
                </div>
                <div className="lg:col-span-2 bg-slate-50 p-8 rounded-xl border border-slate-200">
                  <h3 className="text-3xl font-bold text-slate-900 mb-4">Mark Barney</h3>
                  <p className="text-slate-700 text-lg leading-relaxed mb-6">
                    Mark is an innovative researcher and developer from eastern Connecticut who created this application.
                    He lives on his hobby farm with his two beloved Yorkies, Pawel and Pawleen, and maintains a lively
                    flock of 30-40 chickens of various shapes and sizes.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <a
                      href="https://github.com/82deutschmark"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors duration-200"
                    >
                      GitHub Profile
                    </a>
                    <a
                      href="https://markbarney.net"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      Personal Website
                    </a>
                    <a
                      href="https://arc.gptpluspro.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
                    >
                      AI Data Source
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Collaborators Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-8 py-6">
              <h2 className="text-3xl font-bold text-white">Key Collaborators</h2>
            </div>
            <div className="p-8">
              <div className="bg-slate-50 p-8 rounded-xl border border-slate-200">
                <h3 className="text-3xl font-bold text-slate-900 mb-4">Simon Strandgaard (neoneye)</h3>
                <p className="text-slate-700 text-lg leading-relaxed mb-6">
                  Major thanks to Simon for all his help, support, and encouragement. His work has been a significant
                  source of inspiration and has greatly contributed to the development of this research platform.
                </p>
                <div className="flex flex-wrap gap-4">
                  <a
                    href="https://github.com/neoneye"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors duration-200"
                  >
                    GitHub Profile
                  </a>
                  <a
                    href="https://braingridgame.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                  >
                    BrainGridGame
                  </a>
                  <a
                    href="https://github.com/neoneye/ARC-Interactive"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
                  >
                    ARC-Interactive
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Community & AI Contributors Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-900 to-green-800 px-8 py-6">
              <h2 className="text-3xl font-bold text-white">Community & AI Contributors</h2>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-slate-50 p-8 rounded-xl border border-slate-200 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-semibold text-slate-900 mb-3">ARC Discord Community</h3>
                  <p className="text-slate-600 mb-6">
                    For fostering a collaborative and innovative environment in artificial intelligence research.
                  </p>
                  <a
                    href="https://discord.gg/9b77dPAmcA"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                  >
                    Join Community
                  </a>
                </div>
                <div className="bg-slate-50 p-8 rounded-xl border border-slate-200 text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-semibold text-slate-900 mb-3">Claude Code (Sonnet 4)</h3>
                  <p className="text-slate-600">
                    Advanced AI assistance for PlayFab architecture design and comprehensive documentation systems.
                  </p>
                </div>
                <div className="bg-slate-50 p-8 rounded-xl border border-slate-200 text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-semibold text-slate-900 mb-3">Gemini 2.5 Pro</h3>
                  <p className="text-slate-600">
                    Specialized AI for CloudScript refactoring, feature development, and research platform optimization.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Research Mission Statement */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Research Mission</h2>
            <p className="text-xl text-slate-300 max-w-4xl mx-auto leading-relaxed">
              This platform represents a collaborative effort to advance the field of artificial intelligence through
              rigorous testing, open-source development, and community-driven research. We believe in the power of
              collective intelligence to solve complex problems and push the boundaries of what's possible in AI.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default About;
