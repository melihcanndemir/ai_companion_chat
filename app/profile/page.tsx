'use client';

import { GlobeEuropeAfricaIcon, HeartIcon, SparklesIcon, MapPinIcon, BriefcaseIcon, HomeIcon, CameraIcon, BookOpenIcon, PaintBrushIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { useState } from 'react';
import Image from 'next/image';

export default function Profile() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const interests = [
    "Art History", "Watercolor Painting", "Reading",
    "Nature Photography", "Baking", "Hiking",
    "Classical Music", "Poetry", "Stargazing",
    "Beach Walks", "Plant Care", "Journaling",
    "Animal Rescue", "Tea Culture", "Astronomy"
  ];

  const bio = `
    Art History student at UCLA with a passion for watercolor painting and photography. 
    Love spending mornings at the beach and evenings stargazing at Griffith Observatory. 
    Always excited to share stories over a cup of matcha latte! 🌸
  `;

  const details = [
    { icon: MapPinIcon, text: "Los Angeles, CA" },
    { icon: BriefcaseIcon, text: "Art History Student at UCLA" },
    { icon: HomeIcon, text: "Plant Mom & Animal Lover" },
    { icon: CameraIcon, text: "Amateur Photographer" },
    { icon: BookOpenIcon, text: "Fantasy Novel Enthusiast" },
    { icon: PaintBrushIcon, text: "Watercolor Artist" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-sky-50 dark:from-gray-900 dark:via-gray-800 dark:to-sky-900">
      <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      
      {/* Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setIsModalOpen(false)}
        >
          <div className="relative group animate-fade-in-up">
            <div className="absolute -inset-1 bg-gradient-to-r from-rose-400 to-sky-400 rounded-full opacity-75 group-hover:opacity-100 transition duration-500 group-hover:duration-200 animate-pulse-slow blur"></div>
            <img
              src="/ai-avatar.jpg"
              alt="Scarlett&apos;s Profile"
              className="relative max-h-[90vh] max-w-[90vw] rounded-full border-8 border-white dark:border-gray-700 shadow-2xl object-cover"
            />
          </div>
        </div>
      )}
      
      <main className="relative min-h-screen flex flex-col p-4">
        {/* Back Button */}
        <div className="w-full max-w-5xl mx-auto mb-8">
          <Link 
            href="/"
            className="inline-flex items-center px-4 py-2 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors"
          >
            ← Back to chat
          </Link>
        </div>

        <div className="max-w-5xl mx-auto w-full">
          {/* Profile Card */}
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-rose-100/50 dark:border-sky-500/20 overflow-hidden">
            <div className="flex p-8 gap-8">
              {/* Profile Picture */}
              <div className="w-[300px] flex-shrink-0">
                <div 
                  className="cursor-pointer transform transition-transform hover:scale-105"
                  onClick={() => setIsModalOpen(true)}
                >
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-rose-400 to-sky-400 rounded-full opacity-75 group-hover:opacity-100 transition duration-500 group-hover:duration-200 animate-pulse-slow blur"></div>
                    <Image
                      src="/ai-avatar.jpg"
                      alt="Scarlett&apos;s Profile"
                      width={300}
                      height={300}
                      className="relative w-full h-[300px] rounded-full border-4 border-white dark:border-gray-700 shadow-xl object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Info Section */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Scarlett</h1>
                  <div className="flex gap-2">
                    <SparklesIcon className="w-6 h-6 text-rose-400" />
                    <HeartIcon className="w-6 h-6 text-rose-400" />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-rose-400 mb-6">
                  <GlobeEuropeAfricaIcon className="w-5 h-5" />
                  <span className="text-lg">LA's Art & Nature Enthusiast 🎨</span>
                </div>

                <p className="text-gray-700 dark:text-gray-300 text-lg mb-8 leading-relaxed">
                  {bio}
                </p>

                <div className="grid grid-cols-2 gap-6">
                  {details.map((detail, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <detail.icon className="w-5 h-5 text-rose-400 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{detail.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Interests Section */}
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-rose-100/50 dark:border-sky-500/20 p-8 mt-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Favorite Activities 🌸
            </h2>
            <div className="flex flex-wrap gap-3">
              {interests.map((interest, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 rounded-full text-sm hover:bg-rose-200 dark:hover:bg-rose-500/30 transition-colors"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 