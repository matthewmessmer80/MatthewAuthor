import React, { useState } from 'react';
import {
  Compass,
  Users,
  Shield,
  Layers,
  Sparkles,
  MapPin,
  Bookmark,
  BookOpen,
} from 'lucide-react';

interface Character {
  id: string;
  name: string;
  series: string;
  role: string;
  affiliation: string;
  description: string;
}

interface LoreEntry {
  id: string;
  title: string;
  category: 'Metaphysics' | 'Geography' | 'Naval Tech' | 'Institutions';
  series: string;
  summary: string;
}

const CHARACTERS_DATA: Character[] = [
  {
    id: 'char-1',
    name: 'Lysander Vane',
    series: 'The Breathwoven Cycle',
    role: 'Crown Sentinel / Threadbearer',
    affiliation: 'High Spire of Val-Mora',
    description: 'A disciplined sworn guardian who discovers the golden strand binding the emperor’s lineage has fractured, plunging the Archipelago into silent metaphysical war.',
  },
  {
    id: 'char-2',
    name: 'Ilara of the Sunken Needle',
    series: 'The Breathwoven Cycle',
    role: 'Loom Artisan & Fugitive',
    affiliation: 'Weavers of the Outer Reefs',
    description: 'Born with silver strands dancing behind her pupils, she possesses the forbidden craft to re-stitch torn memories and mend fractures in the metaphysical veil.',
  },
  {
    id: 'char-3',
    name: 'Captain Marcus Miller',
    series: 'The Abyssal Current',
    role: 'Expedition Commander',
    affiliation: 'Nadir Research Vessel ORP Tiefenland',
    description: 'A retired Navy Master-at-Arms whose oceanic charts uncover an anomalous deep-sea current where hydrostatic pressure compresses temporal flow.',
  },
];

const LORE_DATA: LoreEntry[] = [
  {
    id: 'lore-1',
    title: 'The Breathwoven Thread',
    category: 'Metaphysics',
    series: 'The Breathwoven Cycle',
    summary: 'The invisible metaphysical filament connecting life, lineage, and emotional memory across Val-Mora. When severed, all societal covenants bound to that bond instantly decay.',
  },
  {
    id: 'lore-2',
    title: 'Archipelago of Spires',
    category: 'Geography',
    series: 'The Breathwoven Cycle',
    summary: 'A vast ring of vertical limestone needles rising hundreds of cubits from mist-shrouded oceans, linked only by high suspension bridges and woven aerial cable cars.',
  },
  {
    id: 'lore-3',
    title: 'The Compressed Depths',
    category: 'Naval Tech',
    series: 'The Abyssal Current',
    summary: 'At depths exceeding four thousand fathoms, time dilates downward. Submariners descending into the trenches experience minutes while decades pass on the surface.',
  },
  {
    id: 'lore-4',
    title: 'Ignis-Kor: The Subterranean Forge',
    category: 'Geography',
    series: 'The Abyssal Current',
    summary: 'An ancient geothermal foundry carved directly into basalt seabed vents, capable of casting temporal alloys resistant to deep oceanic compression.',
  },
];

export const AdminWorldView: React.FC = () => {
  const [subTab, setSubTab] = useState<'characters' | 'lore'>('characters');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="border-b border-[#232635] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-cinzel font-bold text-[#f5efeb]">
            Characters & Worldbuilding Lore
          </h2>
          <p className="text-xs text-[#8e887a] mt-0.5">
            Canon database for the Val-Mora Archipelago, The Abyssal Current universe, and dramatis personae.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-[#10121a] border border-[#232635] rounded-lg">
          <button
            onClick={() => setSubTab('characters')}
            className={`px-3 py-1.5 rounded-md text-xs font-cinzel tracking-wider transition-colors cursor-pointer ${
              subTab === 'characters'
                ? 'bg-[#c5a059] text-[#0c0d12] font-bold'
                : 'text-[#8e887a] hover:text-[#f5efeb]'
            }`}
          >
            Characters ({CHARACTERS_DATA.length})
          </button>
          <button
            onClick={() => setSubTab('lore')}
            className={`px-3 py-1.5 rounded-md text-xs font-cinzel tracking-wider transition-colors cursor-pointer ${
              subTab === 'lore'
                ? 'bg-[#c5a059] text-[#0c0d12] font-bold'
                : 'text-[#8e887a] hover:text-[#f5efeb]'
            }`}
          >
            World Lore ({LORE_DATA.length})
          </button>
        </div>
      </div>

      {subTab === 'characters' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {CHARACTERS_DATA.map((char) => (
            <div
              key={char.id}
              className="p-5 bg-[#11131c] border border-[#232635] rounded-xl hover:border-[#c5a059]/40 transition-colors space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-cinzel uppercase tracking-widest text-[#c5a059] px-2 py-0.5 bg-[#c5a059]/10 rounded border border-[#c5a059]/20">
                  {char.series}
                </span>
                <Users className="w-3.5 h-3.5 text-[#7d776a]" />
              </div>

              <div>
                <h3 className="text-base font-cinzel font-bold text-[#f5efeb]">
                  {char.name}
                </h3>
                <div className="text-xs text-[#c5a059] font-medium mt-0.5">{char.role}</div>
                <div className="text-[11px] text-[#7d776a]">{char.affiliation}</div>
              </div>

              <p className="text-xs text-[#8e887a] leading-relaxed pt-2 border-t border-[#1e202e]">
                {char.description}
              </p>
            </div>
          ))}
        </div>
      )}

      {subTab === 'lore' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {LORE_DATA.map((lore) => (
            <div
              key={lore.id}
              className="p-5 bg-[#11131c] border border-[#232635] rounded-xl hover:border-[#c5a059]/40 transition-colors space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-cinzel uppercase tracking-widest text-[#5c8df6] px-2 py-0.5 bg-[#5c8df6]/10 rounded border border-[#5c8df6]/20">
                  {lore.category}
                </span>
                <span className="text-[11px] text-[#7d776a] font-cinzel">{lore.series}</span>
              </div>

              <h3 className="text-base font-cinzel font-bold text-[#f5efeb]">
                {lore.title}
              </h3>

              <p className="text-xs text-[#8e887a] leading-relaxed">
                {lore.summary}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
