'use client';

import { Gauge, Boxes, ShieldCheck, BookOpen, Search, ExternalLink, Plane } from 'lucide-react';

interface Project {
  name: string;
  description: string;
  url: string;
  icon: React.ReactNode;
  color: string;
  current?: boolean;
}

const PROJECTS: Project[] = [
  {
    name: 'Aircraft Reliability',
    description:
      'Fleet reliability dashboard tracking failure rates, MTBF/MTBUR and component removal trends to support the reliability programme.',
    url: 'https://aircraft-reliability.vercel.app/',
    icon: <Gauge className="w-5 h-5" />,
    color: 'text-sky-600 bg-sky-100',
  },
  {
    name: 'Technical Records Clustering',
    description:
      'Unsupervised clustering of technical log and defect records to group similar entries and surface recurring fault patterns across the fleet.',
    url: 'https://aircrafttechnicalrecordsclustering.vercel.app/',
    icon: <Boxes className="w-5 h-5" />,
    color: 'text-emerald-600 bg-emerald-100',
  },
  {
    name: 'SAFA Analysis',
    description:
      'Analysis of SAFA (Safety Assessment of Foreign Aircraft) ramp inspection findings, with category breakdowns and trend tracking.',
    url: 'https://safa-analysis-r1.vercel.app/',
    icon: <ShieldCheck className="w-5 h-5" />,
    color: 'text-amber-600 bg-amber-100',
    current: true,
  },
  {
    name: 'ATA Chapter',
    description:
      'ATA 100 chapter explorer that classifies and maps defects to their corresponding ATA chapters for faster routing and analysis.',
    url: 'https://atachapter.vercel.app/',
    icon: <BookOpen className="w-5 h-5" />,
    color: 'text-violet-600 bg-violet-100',
  },
  {
    name: 'CAMO Assistant',
    description:
      'Maintenance history analyzer for the B737 NG/MAX fleet — semantic search over past faults, actions taken and closing references.',
    url: 'https://camo2.vercel.app/',
    icon: <Search className="w-5 h-5" />,
    color: 'text-rose-600 bg-rose-100',
  },
];

export function ProjectsView() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Plane className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Our Projects</h2>
        </div>
        <p className="text-gray-600">
          Reliability &amp; airworthiness tools built by the CAMO team. Click any card to open the live app.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {PROJECTS.map((p) =>
          p.current ? (
            <div
              key={p.url}
              className="flex flex-col rounded-lg border-2 border-blue-300 bg-blue-50 p-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className={`p-2 rounded-lg ${p.color}`}>{p.icon}</div>
                <span className="text-[10px] font-semibold uppercase tracking-wide bg-blue-600 text-white px-2 py-0.5 rounded-full">
                  You are here
                </span>
              </div>
              <h3 className="mt-2.5 text-base font-semibold text-gray-900">{p.name}</h3>
              <p className="mt-1 text-xs text-gray-600 leading-snug">{p.description}</p>
              <span className="mt-2 text-[11px] text-gray-500 truncate">{p.url.replace(/^https?:\/\//, '')}</span>
            </div>
          ) : (
            <a
              key={p.url}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-blue-300 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className={`p-2 rounded-lg ${p.color}`}>{p.icon}</div>
                <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>
              <h3 className="mt-2.5 text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {p.name}
              </h3>
              <p className="mt-1 text-xs text-gray-600 leading-snug">{p.description}</p>
              <span className="mt-2 text-[11px] text-gray-400 truncate">{p.url.replace(/^https?:\/\//, '')}</span>
            </a>
          )
        )}
      </div>
    </div>
  );
}
