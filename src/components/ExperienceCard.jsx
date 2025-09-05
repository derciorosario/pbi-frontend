import styles from '../lib/styles.jsx';
import I from '../lib/icons.jsx';


export default function ExperienceCard({ exp }) {
  return (
    <article className="rounded-2xl bg-white border shadow-sm overflow-hidden">
      <img src={exp.image} alt="" className="w-full h-48 object-cover" />
      <div className="p-4">
        <div className="text-xs text-gray-500">{exp.author} • {exp.time}</div>
        <h3 className="mt-2 font-semibold">{exp.title}</h3>
        <p className="text-sm text-gray-600 mt-1">{exp.desc}</p>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>❤️ {exp.stats.likes}</span>
            <span>💬 {exp.stats.comments}</span>
            <span>🔗 Share</span>
          </div>
          <button className={styles.primary}>{exp.cta}</button>
        </div>
      </div>
    </article>
  );
}