import React from 'react';

interface Props {
  onSelect: (prompt: string) => void;
}

export default function BodyMap({ onSelect }: Props) {
  const areas = [
    {
      name: 'Cervical',
      prompt: 'protocolo cervical',
    },
    {
      name: 'Ombro',
      prompt: 'dor no ombro',
    },
    {
      name: 'Lombar',
      prompt: 'lombalgia',
    },
    {
      name: 'Joelho',
      prompt: 'dor no joelho',
    },
  ];

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex gap-2 min-w-max">
        {areas.map((area) => (
          <button
            key={area.name}
            onClick={() => onSelect(area.prompt)}
            className="px-4 py-2 rounded-full bg-dark-700 hover:bg-accent-700 border border-dark-500 text-sm text-white transition-all duration-200"
          >
            {area.name}
          </button>
        ))}
      </div>
    </div>
  );
}