import React from "react";

/* mini helpers */
const Stat = ({ title, value, delta, icon }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-4">
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="h-8 w-8 grid place-items-center rounded-md bg-brand-50 text-brand-600">
        {icon}
      </div>
    </div>
    <div className="mt-1 text-2xl font-bold">{value}</div>
    {delta && <div className="text-xs text-emerald-600 mt-1">{delta}</div>}
  </div>
);

const LineChart = () => (
  <svg viewBox="0 0 400 160" className="w-full h-40">
    <polyline
      className="fill-none stroke-brand-500"
      strokeWidth="3"
      points="10,140 60,110 110,100 160,70 210,55 260,40 310,25 360,15"
    />
    <line x1="10" y1="140" x2="380" y2="140" className="stroke-gray-200" />
  </svg>
);

const Pie = () => (
  <svg viewBox="0 0 32 32" className="w-36 h-36">
    <circle r="16" cx="16" cy="16" className="fill-gray-100" />
    <path d="M16 16 L16 0 A16 16 0 0 1 30 22 Z" className="fill-brand-500" />
    <path d="M16 16 L30 22 A16 16 0 0 1 6 28 Z" className="fill-brand-700" />
    <path d="M16 16 L6 28 A16 16 0 0 1 2 10 Z" className="fill-amber-500" />
    <path d="M16 16 L2 10 A16 16 0 0 1 16 0 Z" className="fill-emerald-500" />
  </svg>
);

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl md:text-2xl font-bold">Dashboard Overview</h1>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          title="Total Users"
          value="12,847"
          delta="↑ 12% from last month"
          icon={<span>👥</span>}
        />
        <Stat
          title="Active Connections"
          value="8,234"
          delta="↑ 8% from last month"
          icon={<span>🔗</span>}
        />
        <Stat
          title="Disabled users"
          value="2"
          icon={<span>
             {/*** add icon */}
          </span>}
        />
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">Pending Reports</div>
            <div className="h-8 w-8 grid place-items-center rounded-md bg-red-50 text-red-500">
              🚩
            </div>
          </div>
          <div className="mt-1 text-2xl font-bold">23</div>
          <div className="text-xs text-red-600 mt-1">Requires attention</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="font-semibold">User Growth</div>
          <LineChart />
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="font-semibold">User Identities  Distribution</div>
          <div className="flex items-center gap-6 mt-2">
            <Pie />
            <ul className="text-sm space-y-1">
              <li>
                <span className="inline-block h-3 w-3 rounded-sm mr-2 bg-brand-500" />
                Entrepreneur (Startups)
              </li>
              <li>
                <span className="inline-block h-3 w-3 rounded-sm mr-2 bg-brand-700" />
                Established Entrepreneurs / Businesses
              </li>
              <li>
                <span className="inline-block h-3 w-3 rounded-sm mr-2 bg-amber-500" />
                Social Entrepreneurs
              </li>
              <li>
                <span className="inline-block h-3 w-3 rounded-sm mr-2 bg-emerald-500" />
                Professional
              </li>

                <li>
                <span className="inline-block h-3 w-3 rounded-sm mr-2 bg-emerald-500" />
                Freelancers
              </li>

              <li>
                <span className="inline-block h-3 w-3 rounded-sm mr-2 bg-emerald-500" />
                Students
              </li>

              
              <li>
                <span className="inline-block h-3 w-3 rounded-sm mr-2 bg-emerald-500" />
                Government Officials
              </li>

                <li>
                <span className="inline-block h-3 w-3 rounded-sm mr-2 bg-emerald-500" />
                Investor
              </li>
              
              <li>
                <span className="inline-block h-3 w-3 rounded-sm mr-2 bg-gray-300" />
                Others
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="font-semibold">Recent Activity</div>
        <ul className="divide-y divide-gray-100 mt-2">
          {[
            {
              t: "New user registration",
              s: "Sarah Johnson joined as an Entrepreneur",
              time: "2 minutes ago",
              icon: "🧑‍💼",
            },
            {
              t: "Content reported",
              s: "Post flagged for inappropriate content",
              time: "15 minutes ago",
              icon: "🚩",
            },
           
          ].map((a, i) => (
            <li key={i} className="py-3 flex items-center">
              <span className="mr-3 text-lg">{a.icon}</span>
              <div className="flex-1">
                <div className="text-sm font-medium">{a.t}</div>
                <div className="text-xs text-gray-500">{a.s}</div>
              </div>
              <div className="text-xs text-gray-500">{a.time}</div>
            </li>
          ))}
        </ul>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <button className="rounded-xl px-4 py-6 text-white font-semibold bg-brand-500 hover:bg-brand-600">
          ➕ Send Notification
        </button>
        <button className="rounded-xl px-4 py-6 text-white font-semibold bg-blue-600">
          ⬇️ Export Data
        </button>
       
      </div>
    </div>
  );
}
