// src/components/cards/PostCard.jsx
import React from "react";
import { styles } from "../ui/UiStyles";
import I from "../ui/UiIcons";

export default function PostCard({ p }) {
  return (
    <article className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <img alt="" className="h-10 w-10 rounded-full object-cover" src={`https://i.pravatar.cc/100?img=${p.id + 8}`} />
          <div>
            <div className="font-semibold">{p.author}</div>
            <div className="text-xs text-gray-500">{p.subtitle}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="h-8 w-8 grid place-items-center rounded-lg border text-gray-600">
            <I.msg />
          </button>
          <button className={styles.primary}>Connect</button>
        </div>
      </div>
      <p className="mt-3 text-[15px] text-gray-700">{p.text}</p>
      {p.image && <img src={p.image} alt="" className="mt-4 w-full rounded-xl object-cover aspect-[16/9]" />}
      <div className="mt-4 flex items-center gap-5 text-sm text-gray-500">
        <div className="flex items-center gap-1"><I.heart />{p.stats.likes}</div>
        <div className="flex items-center gap-1"><I.comment />{p.stats.comments}</div>
        <div className="flex items-center gap-1"><I.share />Share</div>
      </div>
    </article>
  );
}
