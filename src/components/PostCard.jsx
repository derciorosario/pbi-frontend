import React from 'react';
import styles from '../lib/styles.jsx';
import I from '../lib/icons.jsx';

function PostCard({ post }) {
  return (
    <article className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <img alt="" className="h-10 w-10 rounded-full object-cover" src={`https://i.pravatar.cc/100?img=${post.id + 8}`} />
          <div>
            <div className="font-semibold">{post.author}</div>
            <div className="text-xs text-gray-500">{post.subtitle}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="grid place-items-center h-8 w-8 rounded-lg border border-gray-200 text-gray-600">
            <I.msg />
          </button>
          <button className={styles.primary}>Connect</button>
        </div>
      </div>

      <p className="mt-3 text-[15px] text-gray-700">{post.text}</p>
      {post.image && (
        <img src={post.image} alt="" className="mt-4 w-full rounded-xl object-cover aspect-[16/9]" />
      )}

      <div className="mt-4 flex items-center gap-5 text-sm text-gray-500">
        <div className="flex items-center gap-1"><I.heart />{post.stats.likes}</div>
        <div className="flex items-center gap-1"><I.comment />{post.stats.comments}</div>
        <div className="flex items-center gap-1"><I.share />Share</div>
      </div>
    </article>
  );
}

export default PostCard;