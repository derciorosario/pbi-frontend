// src/components/SuggestedMatches.jsx
import React from "react";
import I from "../lib/icons.jsx";
import styles from "../lib/styles.jsx";

function avatarSrc(item, idx = 0) {
  if (item?.avatarUrl) return item.avatarUrl;
  if (item?.avatar) return item.avatar;
  if (item?.email) return `https://i.pravatar.cc/100?u=${encodeURIComponent(item.email)}`;
  if (item?.name) return `https://i.pravatar.cc/100?u=${encodeURIComponent(item.name)}`;
  return `https://i.pravatar.cc/100?img=${30 + idx}`;
}

export default function SuggestedMatches({ matches = [], nearby = [] }) {
  return (
    <div className="space-y-4">
      {/* -------- Matches -------- */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
        <h3 className="font-semibold">Connection Suggestions ({matches.length})</h3>
        <div className="mt-4 space-y-3">
          {matches.map((s, idx) => (
            <div key={s.id || s.name || idx} className="rounded-xl border border-gray-100 p-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img
                    alt=""
                    className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                    src={avatarSrc(s, idx)}
                  />
                  <div>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-gray-500">
                      {s.title || s.role}
                      {s.city || s.country ? (
                        <>
                          {" "}
                          • {s.city ? `${s.city}` : ""}
                          {s.city && s.country ? ", " : ""}
                          {s.country ? `${s.country}` : ""}
                        </>
                      ) : null}
                    </div>
                    {s.tag ? (
                      <div className="text-[11px] text-[#8a358a]">Looking for: {s.tag}</div>
                    ) : null}

                 
                  </div>
                  
                </div>
                
                 <button className="grid shrink-0 place-items-center h-8 w-8 rounded-lg border border-gray-200 text-gray-600">
                <I.see />
              </button>
              
              </div>
                 
                    {/* categories */}
                    {s.cats?.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {s.cats.filter((i,_i)=>_i <= 2).map((c) => (
                          <span
                            key={c}
                            className="inline-block bg-gray-100 text-gray-600 text-[11px] px-2 py-0.5 rounded-full"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    )}

              <div className="mt-3 flex items-center gap-2">
                <button
                  className="flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-white"
                  style={{ background: "#8A358A" }}
                >
                  Connect
                </button>
                <button className="flex-1 rounded-lg px-3 py-1.5 text-sm border border-gray-200 text-gray-700 bg-white">
                  Message
                </button>
              </div>
            </div>
          ))}
          {matches.length === 0 && (
            <div className="text-sm text-gray-500 border rounded-xl p-3">
              No suggestions right now.
            </div>
          )}
        </div>
        <button className="mt-3 w-full rounded-lg py-2 text-sm font-medium text-[#8A358A] hover:underline">
          View All Connections
        </button>
      </div>

      {/* -------- Nearby -------- */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
        <h3 className="font-semibold">Nearby Professionals</h3>
        <div className="mt-3 space-y-3">
          {nearby.map((p, idx) => (
            <div
              key={p.id || p.name || idx}
              className="flex flex-col border-b last:border-b-0 pb-3 last:pb-0"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    alt=""
                    className="h-9 w-9 rounded-full object-cover flex-shrink-0"
                    src={avatarSrc(p, idx)}
                  />
                  <div>
                    <div className="text-sm font-medium">{p.name}</div>
                    <div className="text-xs text-gray-500">
                      {p.role || p.title}
                      {p.city || p.country ? (
                        <>
                          {" "}
                          • {p.city ? `${p.city}` : ""}
                          {p.city && p.country ? ", " : ""}
                          {p.country ? `${p.country}` : ""}
                        </>
                      ) : null}
                    </div>

                  </div>
                </div>
                <button className="rounded-lg px-3 py-1.5 text-sm border border-gray-200 bg-white">
                  Connect
                </button>
                
              </div>
              
                    {/* categories */}
                    {p.cats?.length > 0 && (
                      <div className="mt-1 flex  flex-wrap gap-1">
                        {p.cats.filter((i,_i)=>_i <= 2).map((c) => (
                          <span
                            key={c}
                            className="inline-block bg-gray-100 text-gray-600 text-[11px] px-2 py-0.5 rounded-full"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
            </div>
          ))}
          {nearby.length === 0 && (
            <div className="text-sm text-gray-500 border rounded-xl p-3">
              No nearby profiles for these filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
