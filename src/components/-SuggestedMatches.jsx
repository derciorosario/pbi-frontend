import React from 'react';
import styles from '../lib/styles.jsx';
import I from '../lib/icons.jsx';
import { matches } from '../lib/data';

function SuggestedMatches() {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
      <h3 className="font-semibold">Suggested Matches</h3>
      <div className="mt-4 space-y-3">
        {matches.map((m, i) => (
          <div key={m.name} className="rounded-xl border border-gray-100 p-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img
                  alt=""
                  className="h-10 w-10 rounded-full object-cover"
                  src={`https://i.pravatar.cc/100?img=${20 + i}`}
                />
                <div>
                  <div className="font-medium">{m.name}</div>
                  <div className="text-xs text-gray-500">{m.title}</div>
                  <div className="text-[11px] text-[#8a358a]">
                    Looking for: {m.looking}
                  </div>
                </div>
              </div>
              <button className="grid place-items-center h-8 w-8 rounded-lg border border-gray-200 text-gray-600">
                <I.see />
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button className={`flex-1 ${styles.primary}`}>Connect</button>
              <button className="flex-1 rounded-lg px-3 py-1.5 text-sm border border-gray-200 bg-white text-gray-700">
                Message
              </button>
            </div>
          </div>
        ))}
      </div>
      <button className="mt-3 w-full rounded-lg py-2 text-sm font-medium text-[#8A358A] hover:underline">
        See all matches
      </button>
    </div>
  );
}

export default SuggestedMatches;