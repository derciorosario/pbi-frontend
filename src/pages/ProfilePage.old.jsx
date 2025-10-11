// src/pages/PublicProfilePage.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import {
   MapPin,
   X,
   Briefcase,
   CalendarDays,
   Star,
   Hash,
   User2,
   Target,
   Layers,
   Languages,
   ExternalLink,
   Clock,
   Video,
   Map as MapIcon,
   Link as LinkIcon,
   UserCheck,
   UserMinus,
   UserX,
   Trash2,
   ShieldBan,
   Flag,
   Activity,
   Share2,
   Copy as CopyIcon,
 } from "lucide-react";
import client from "../api/client";
import ConnectionRequestModal from "../components/ConnectionRequestModal";
import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "../lib/toast";
import Header from "../components/Header";
import DefaultLayout from "../layout/DefaultLayout";
import ConfirmDialog from "../components/ConfirmDialog";
import JobCard from "../components/JobCard";
import NeedCard from "../components/NeedCard";
import ServiceCard from "../components/ServiceCard";
import ProductCard from "../components/ProductCard-1";
import MomentCard from "../components/MomentCard";
import ExperienceCard from "../components/ExperienceCard";
import CrowdfundCard from "../components/CrowdfundCard";
import EventCard from "../components/EventCard";
import {
  FacebookShareButton,
  FacebookIcon,
  LinkedinShareButton,
  LinkedinIcon,
  TwitterShareButton,
  TwitterIcon,
  WhatsappShareButton,
  WhatsappIcon,
  TelegramShareButton,
  TelegramIcon,
  EmailShareButton,
  EmailIcon,
  FacebookMessengerShareButton,
  FacebookMessengerIcon,
} from "react-share";

/* -------------------------------- utils --------------------------------- */
function timeAgo(iso) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const s = Math.floor((now - then) / 1000);
  if (s < 60) return "Just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min${m > 1 ? "s" : ""} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? "s" : ""} ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} day${d > 1 ? "s" : ""} ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo} month${mo > 1 ? "s" : ""} ago`;
  const y = Math.floor(mo / 12);
  return `${y} year${y > 1 ? "s" : ""} ago`;
}
function fmtLoc(city, country) {
  if (city && country) return `${city}, ${country}`;
  return city || country || "";
}
function Chip({ children, tone = "brand" }) {
  const tones = {
    brand: "bg-brand-50 text-brand-600",
    green: "bg-green-100 text-green-700",
    gray: "bg-gray-100 text-gray-700",
    blue: "bg-blue-100 text-blue-700",
    red: "bg-red-100 text-red-700",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] ${tones[tone] || tones.gray}`}>
      {children}
    </span>
  );
}
function Section({ title, icon: Icon, children }) {
  return (
    <div className="mt-5 text-left">
      <div className="flex items-center gap-2 mb-2">
        {Icon ? <Icon size={16} className="text-brand-600" /> : null}
        <h3 className="font-medium text-sm">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function getInitials(name) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.charAt(0).toUpperCase() || "";
  const second = parts[1]?.charAt(0).toUpperCase() || "";
  return first + second;
}

// Share data and components
const ShareMenu = ({ profile, shareMenuRef, setShareOpen }) => {
  const shareUrl = `https://54links.com/profile/${profile?.id}`;
  const shareTitle = `${profile?.name || "Profile"} on 54Links`;
  const shareDescription = profile?.about || `Check out ${profile?.name || "this profile"} on 54Links`;
  const shareQuote = shareDescription.slice(0, 160) + (shareDescription.length > 160 ? "…" : "");
  const shareHashtags = ["54Links", "Profile", "Networking"].filter(Boolean);
  const messengerAppId = import.meta?.env?.VITE_FACEBOOK_APP_ID || undefined;

  return (
    <div
      ref={shareMenuRef}
      className="absolute bottom-14 left-0 mt-2 z-30 w-64 rounded-xl border border-gray-200 bg-white p-3 shadow-xl"
      role="dialog"
      aria-label="Share options"
    >
      <div className="text-xs font-medium text-gray-500 px-1 pb-2">
        Share this profile
      </div>

      <div className="grid grid-cols-3 gap-2">
        <WhatsappShareButton url={shareUrl} title={shareTitle} separator=" — ">
          <div className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-50">
            <WhatsappIcon size={40} round />
            <span className="text-xs text-gray-700">WhatsApp</span>
          </div>
        </WhatsappShareButton>

        <FacebookShareButton url={shareUrl} quote={shareQuote} hashtag="#54Links">
          <div className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-50">
            <FacebookIcon size={40} round />
            <span className="text-xs text-gray-700">Facebook</span>
          </div>
        </FacebookShareButton>

        <LinkedinShareButton url={shareUrl} title={shareTitle} summary={shareQuote} source="54Links">
          <div className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-50">
            <LinkedinIcon size={40} round />
            <span className="text-xs text-gray-700">LinkedIn</span>
          </div>
        </LinkedinShareButton>

        <TwitterShareButton url={shareUrl} title={shareTitle} hashtags={shareHashtags}>
          <div className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-50">
            <TwitterIcon size={40} round />
            <span className="text-xs text-gray-700">X / Twitter</span>
          </div>
        </TwitterShareButton>

        <TelegramShareButton url={shareUrl} title={shareTitle}>
          <div className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-50">
            <TelegramIcon size={40} round />
            <span className="text-xs text-gray-700">Telegram</span>
          </div>
        </TelegramShareButton>

        <EmailShareButton url={shareUrl} subject={shareTitle} body={shareQuote + "\n\n" + shareUrl}>
          <div className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-50">
            <EmailIcon size={40} round />
            <span className="text-xs text-gray-700">Email</span>
          </div>
        </EmailShareButton>

        {messengerAppId && (
          <FacebookMessengerShareButton url={shareUrl} appId={messengerAppId}>
            <div className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-50">
              <FacebookMessengerIcon size={40} round />
              <span className="text-xs text-gray-700">Messenger</span>
            </div>
          </FacebookMessengerShareButton>
        )}
      </div>

      <div className="mt-2">
        <CopyLinkButton shareUrl={shareUrl} setShareOpen={setShareOpen} />
      </div>
    </div>
  );
};

const CopyLinkButton = ({ shareUrl, setShareOpen }) => {
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(shareUrl);
          toast.success("Link copied");
          setShareOpen(false);
        } catch {
          toast.error("Failed to copy link");
        }
      }}
      className="flex items-center gap-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
    >
      <CopyIcon size={16} />
      Copy link
    </button>
  );
};
/* ----------------------- meeting time / status utils --------------------- */
function addMinutes(dateIso, mins) {
  if (!dateIso) return null;
  try {
    const date = new Date(dateIso);
    if (isNaN(date.getTime())) return null;
    const t = date.getTime();
    return new Date(t + mins * 60000).toISOString();
  } catch {
    return null;
  }
}
function isJoinWindow(startIso, durationMin) {
  if (!startIso) return false;
  try {
    const now = Date.now();
    const startDate = new Date(startIso);
    if (isNaN(startDate.getTime())) return false;
    const start = startDate.getTime();
    const joinOpen = start - 10 * 60 * 1000; // 10min antes
    const endTimeStr = addMinutes(startIso, Number(durationMin) || 30);
    const end = endTimeStr ? new Date(endTimeStr).getTime() : start + (Number(durationMin) || 30) * 60 * 1000;
    return now >= joinOpen && now <= end;
  } catch {
    return false;
  }
}
function humanWhen(startIso, tz, durationMin) {
  if (!startIso) return "Invalid date";
  try {
    const s = new Date(startIso);
    if (isNaN(s.getTime())) return "Invalid date";
    const opts = { dateStyle: "medium", timeStyle: "short", timeZone: tz || undefined };
    return `${s.toLocaleString(undefined, opts)} • ${durationMin} min`;
  } catch {
    return "Invalid date";
  }
}
/* ----------------------- MeetingRequestModal (inline) -------------------- */

const timezones = [ 
  "Africa/Abidjan",
  "Africa/Accra",
  "Africa/Addis_Ababa",
  "Africa/Algiers",
  "Africa/Asmara",
  "Africa/Bamako",
  "Africa/Bangui",
  "Africa/Banjul",
  "Africa/Bissau",
  "Africa/Blantyre",
  "Africa/Brazzaville",
  "Africa/Bujumbura",
  "Africa/Cairo",
  "Africa/Casablanca",
  "Africa/Ceuta",
  "Africa/Conakry",
  "Africa/Dakar",
  "Africa/Dar_es_Salaam",
  "Africa/Djibouti",
  "Africa/Douala",
  "Africa/El_Aaiun",
  "Africa/Freetown",
  "Africa/Gaborone",
  "Africa/Harare",
  "Africa/Johannesburg",
  "Africa/Juba",
  "Africa/Kampala",
  "Africa/Khartoum",
  "Africa/Kigali",
  "Africa/Kinshasa",
  "Africa/Lagos",
  "Africa/Libreville",
  "Africa/Lome",
  "Africa/Luanda",
  "Africa/Lubumbashi",
  "Africa/Lusaka",
  "Africa/Malabo",
  "Africa/Maputo",
  "Africa/Maseru",
  "Africa/Mbabane",
  "Africa/Mogadishu",
  "Africa/Monrovia",
  "Africa/Nairobi",
  "Africa/Ndjamena",
  "Africa/Niamey",
  "Africa/Nouakchott",
  "Africa/Ouagadougou",
  "Africa/Porto-Novo",
  "Africa/Sao_Tome",
  "Africa/Tripoli",
  "Africa/Tunis",
  "Africa/Windhoek",

  "America/Adak",
  "America/Anchorage",
  "America/Anguilla",
  "America/Antigua",
  "America/Araguaina",
  "America/Argentina/Buenos_Aires",
  "America/Argentina/Catamarca",
  "America/Argentina/Cordoba",
  "America/Argentina/Jujuy",
  "America/Argentina/La_Rioja",
  "America/Argentina/Mendoza",
  "America/Argentina/Rio_Gallegos",
  "America/Argentina/Salta",
  "America/Argentina/San_Juan",
  "America/Argentina/San_Luis",
  "America/Argentina/Tucuman",
  "America/Argentina/Ushuaia",
  "America/Aruba",
  "America/Asuncion",
  "America/Atikokan",
  "America/Bahia",
  "America/Bahia_Banderas",
  "America/Barbados",
  "America/Belem",
  "America/Belize",
  "America/Blanc-Sablon",
  "America/Boa_Vista",
  "America/Bogota",
  "America/Boise",
  "America/Cambridge_Bay",
  "America/Campo_Grande",
  "America/Cancun",
  "America/Caracas",
  "America/Cayenne",
  "America/Cayman",
  "America/Chicago",
  "America/Chihuahua",
  "America/Costa_Rica",
  "America/Creston",
  "America/Cuiaba",
  "America/Curacao",
  "America/Danmarkshavn",
  "America/Dawson",
  "America/Dawson_Creek",
  "America/Denver",
  "America/Detroit",
  "America/Dominica",
  "America/Edmonton",
  "America/Eirunepe",
  "America/El_Salvador",
  "America/Fortaleza",
  "America/Fort_Nelson",
  "America/Glace_Bay",
  "America/Godthab",
  "America/Goose_Bay",
  "America/Grand_Turk",
  "America/Grenada",
  "America/Guadeloupe",
  "America/Guatemala",
  "America/Guayaquil",
  "America/Guyana",
  "America/Halifax",
  "America/Havana",
  "America/Hermosillo",
  "America/Indiana/Indianapolis",
  "America/Indiana/Knox",
  "America/Indiana/Marengo",
  "America/Indiana/Petersburg",
  "America/Indiana/Tell_City",
  "America/Indiana/Vevay",
  "America/Indiana/Vincennes",
  "America/Indiana/Winamac",
  "America/Inuvik",
  "America/Iqaluit",
  "America/Jamaica",
  "America/Juneau",
  "America/Kentucky/Louisville",
  "America/Kentucky/Monticello",
  "America/Kralendijk",
  "America/La_Paz",
  "America/Lima",
  "America/Los_Angeles",
  "America/Lower_Princes",
  "America/Maceio",
  "America/Managua",
  "America/Manaus",
  "America/Marigot",
  "America/Martinique",
  "America/Matamoros",
  "America/Mazatlan",
  "America/Menominee",
  "America/Merida",
  "America/Metlakatla",
  "America/Mexico_City",
  "America/Miquelon",
  "America/Moncton",
  "America/Monterrey",
  "America/Montevideo",
  "America/Montserrat",
  "America/Nassau",
  "America/New_York",
  "America/Nipigon",
  "America/Nome",
  "America/Noronha",
  "America/North_Dakota/Beulah",
  "America/North_Dakota/Center",
  "America/North_Dakota/New_Salem",
  "America/Nuuk",
  "America/Ojinaga",
  "America/Panama",
  "America/Pangnirtung",
  "America/Paramaribo",
  "America/Phoenix",
  "America/Port-au-Prince",
  "America/Port_of_Spain",
  "America/Porto_Velho",
  "America/Puerto_Rico",
  "America/Punta_Arenas",
  "America/Rainy_River",
  "America/Rankin_Inlet",
  "America/Recife",
  "America/Regina",
  "America/Resolute",
  "America/Rio_Branco",
  "America/Santarem",
  "America/Santiago",
  "America/Santo_Domingo",
  "America/Sao_Paulo",
  "America/Scoresbysund",
  "America/Sitka",
  "America/St_Barthelemy",
  "America/St_Johns",
  "America/St_Kitts",
  "America/St_Lucia",
  "America/St_Thomas",
  "America/St_Vincent",
  "America/Swift_Current",
  "America/Tegucigalpa",
  "America/Thule",
  "America/Thunder_Bay",
  "America/Tijuana",
  "America/Toronto",
  "America/Tortola",
  "America/Vancouver",
  "America/Whitehorse",
  "America/Winnipeg",
  "America/Yakutat",
  "America/Yellowknife",

  "Antarctica/Casey",
  "Antarctica/Davis",
  "Antarctica/DumontDUrville",
  "Antarctica/Macquarie",
  "Antarctica/Mawson",
  "Antarctica/Palmer",
  "Antarctica/Rothera",
  "Antarctica/Syowa",
  "Antarctica/Troll",
  "Antarctica/Vostok",

  "Arctic/Longyearbyen",

  "Asia/Aden",
  "Asia/Almaty",
  "Asia/Amman",
  "Asia/Anadyr",
  "Asia/Aqtau",
  "Asia/Aqtobe",
  "Asia/Ashgabat",
  "Asia/Atyrau",
  "Asia/Baghdad",
  "Asia/Bahrain",
  "Asia/Baku",
  "Asia/Bangkok",
  "Asia/Barnaul",
  "Asia/Beirut",
  "Asia/Bishkek",
  "Asia/Brunei",
  "Asia/Chita",
  "Asia/Choibalsan",
  "Asia/Colombo",
  "Asia/Damascus",
  "Asia/Dhaka",
  "Asia/Dili",
  "Asia/Dubai",
  "Asia/Dushanbe",
  "Asia/Famagusta",
  "Asia/Gaza",
  "Asia/Hebron",
  "Asia/Ho_Chi_Minh",
  "Asia/Hong_Kong",
  "Asia/Hovd",
  "Asia/Irkutsk",
  "Asia/Jakarta",
  "Asia/Jayapura",
  "Asia/Jerusalem",
  "Asia/Kabul",
  "Asia/Kamchatka",
  "Asia/Karachi",
  "Asia/Kathmandu",
  "Asia/Khandyga",
  "Asia/Kolkata",
  "Asia/Krasnoyarsk",
  "Asia/Kuala_Lumpur",
  "Asia/Kuching",
  "Asia/Kuwait",
  "Asia/Macau",
  "Asia/Magadan",
  "Asia/Makassar",
  "Asia/Manila",
  "Asia/Muscat",
  "Asia/Nicosia",
  "Asia/Novokuznetsk",
  "Asia/Novosibirsk",
  "Asia/Omsk",
  "Asia/Oral",
  "Asia/Phnom_Penh",
  "Asia/Pontianak",
  "Asia/Pyongyang",
  "Asia/Qatar",
  "Asia/Qostanay",
  "Asia/Qyzylorda",
  "Asia/Riyadh",
  "Asia/Sakhalin",
  "Asia/Samarkand",
  "Asia/Seoul",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Asia/Srednekolymsk",
  "Asia/Taipei",
  "Asia/Tashkent",
  "Asia/Tbilisi",
  "Asia/Tehran",
  "Asia/Thimphu",
  "Asia/Tokyo",
  "Asia/Tomsk",
  "Asia/Ulaanbaatar",
  "Asia/Urumqi",
  "Asia/Ust-Nera",
  "Asia/Vientiane",
  "Asia/Vladivostok",
  "Asia/Yakutsk",
  "Asia/Yangon",
  "Asia/Yekaterinburg",
  "Asia/Yerevan",

  "Atlantic/Azores",
  "Atlantic/Bermuda",
  "Atlantic/Canary",
  "Atlantic/Cape_Verde",
  "Atlantic/Faroe",
  "Atlantic/Madeira",
  "Atlantic/Reykjavik",
  "Atlantic/South_Georgia",
  "Atlantic/St_Helena",
  "Atlantic/Stanley",

  "Australia/Adelaide",
  "Australia/Brisbane",
  "Australia/Broken_Hill",
  "Australia/Darwin",
  "Australia/Eucla",
  "Australia/Hobart",
  "Australia/Lindeman",
  "Australia/Lord_Howe",
  "Australia/Melbourne",
  "Australia/Perth",
  "Australia/Sydney",

  "Europe/Amsterdam",
  "Europe/Andorra",
  "Europe/Astrakhan",
  "Europe/Athens",
  "Europe/Belgrade",
  "Europe/Berlin",
  "Europe/Bratislava",
  "Europe/Brussels",
  "Europe/Bucharest",
  "Europe/Budapest",
  "Europe/Busingen",
  "Europe/Chisinau",
  "Europe/Copenhagen",
  "Europe/Dublin",
  "Europe/Gibraltar",
  "Europe/Guernsey",
  "Europe/Helsinki",
  "Europe/Isle_of_Man",
  "Europe/Istanbul",
  "Europe/Jersey",
  "Europe/Kaliningrad",
  "Europe/Kiev",
  "Europe/Kirov",
  "Europe/Lisbon",
  "Europe/Ljubljana",
  "Europe/London",
  "Europe/Luxembourg",
  "Europe/Madrid",
  "Europe/Malta",
  "Europe/Mariehamn",
  "Europe/Minsk",
  "Europe/Monaco",
  "Europe/Moscow",
  "Europe/Oslo",
  "Europe/Paris",
  "Europe/Podgorica",
  "Europe/Prague",
  "Europe/Riga",
  "Europe/Rome",
  "Europe/Samara",
  "Europe/San_Marino",
  "Europe/Sarajevo",
  "Europe/Saratov",
  "Europe/Simferopol",
  "Europe/Skopje",
  "Europe/Sofia",
  "Europe/Stockholm",
  "Europe/Tallinn",
  "Europe/Tirane",
  "Europe/Ulyanovsk",
  "Europe/Uzhgorod",
  "Europe/Vaduz",
  "Europe/Vatican",
  "Europe/Vienna",
  "Europe/Vilnius",
  "Europe/Volgograd",
  "Europe/Warsaw",
  "Europe/Zagreb",
  "Europe/Zaporozhye",
  "Europe/Zurich",

  "Indian/Antananarivo",
  "Indian/Chagos",
  "Indian/Christmas",
  "Indian/Cocos",
  "Indian/Comoro",
  "Indian/Kerguelen",
  "Indian/Mahe",
  "Indian/Maldives",
  "Indian/Mauritius",
  "Indian/Mayotte",
  "Indian/Reunion",

  "Pacific/Apia",
  "Pacific/Auckland",
  "Pacific/Bougainville",
  "Pacific/Chatham",
  "Pacific/Chuuk",
  "Pacific/Easter",
  "Pacific/Efate",
  "Pacific/Enderbury",
  "Pacific/Fakaofo",
  "Pacific/Fiji",
  "Pacific/Funafuti",
  "Pacific/Galapagos",
  "Pacific/Gambier",
  "Pacific/Guadalcanal",
  "Pacific/Guam",
  "Pacific/Honolulu",
  "Pacific/Kanton",
  "Pacific/Kiritimati",
  "Pacific/Kosrae",
  "Pacific/Kwajalein",
  "Pacific/Majuro",
  "Pacific/Marquesas",
  "Pacific/Midway",
  "Pacific/Nauru",
  "Pacific/Niue",
  "Pacific/Norfolk",
  "Pacific/Noumea",
  "Pacific/Pago_Pago",
  "Pacific/Palau",
  "Pacific/Pitcairn",
  "Pacific/Pohnpei",
  "Pacific/Port_Moresby",
  "Pacific/Rarotonga",
  "Pacific/Saipan",
  "Pacific/Tahiti",
  "Pacific/Tarawa",
  "Pacific/Tongatapu",
  "Pacific/Wake",
  "Pacific/Wallis"
];


function MeetingRequestModal({ open, onClose, toUserId, toName, onCreated }) {
  const defaultTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const [form, setForm] = useState({
    date: "",
    time: "",
    duration: "30",
    mode: "video",
    location: "",
    link: "",
    title: `Meeting with ${toName ?? "User"}`,
    agenda: "",
    timezone: defaultTz,
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  useEffect(() => {
    if (!open) return;
    setErrors({});
    setSubmitting(false);
  }, [open]);
  function validate() {
    const e = {};
    if (!form.date) e.date = "Pick a date";
    if (!form.time) e.time = "Pick a time";
    if (!form.title.trim()) e.title = "Add a title";
    if (form.mode === "video" && !form.link.trim()) e.link = "Add a call link";
    if (form.mode === "in_person" && !form.location.trim()) e.location = "Add a location";
    return e;
  }
  function handleChange(k, v) { setForm((f) => ({ ...f, [k]: v })); }
  async function handleSubmit(e) {
    e.preventDefault();
    const eMap = validate();
    setErrors(eMap);
    if (Object.keys(eMap).length) return;
    const isoStart = new Date(`${form.date}T${form.time}:00`).toISOString();
    setSubmitting(true);
    try {
      const payload = {
        toUserId,
        title: form.title,
        agenda: form.agenda,
        scheduledAt: isoStart,
        duration: parseInt(form.duration),
        timezone: form.timezone,
        mode: form.mode,
        location: form.mode === "in_person" ? form.location : null,
        link: form.mode === "video" ? form.link : null
      };
      const { data } = await client.post("/meeting-requests", payload);
      toast.success("Meeting request sent successfully!");
      onCreated?.(data);
      onClose();
    } catch (error) {
      console.error("Error creating meeting request:", error);
      toast.error(error?.response?.data?.message || "Failed to send meeting request");
    } finally {
      setSubmitting(false);
    }
  }
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-[92vw] sm:w-full sm:max-w-lg max-h-[80vh] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between bg-brand-500 px-4 py-3">
          <div className="text-white font-medium">Request Meeting</div>
          <button onClick={onClose} className="text-white/90 hover:text-white"><X size={20} /></button>
        </div>
        <form id="meetingForm" onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
            <input type="text" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              value={form.title} onChange={(e) => handleChange("title", e.target.value)} placeholder="e.g., Intro call about collaboration" />
            {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
              <input type="date" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                value={form.date} onChange={(e) => handleChange("date", e.target.value)} />
              {errors.date && <p className="text-xs text-red-600 mt-1">{errors.date}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Time</label>
              <input type="time" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                value={form.time} onChange={(e) => handleChange("time", e.target.value)} />
              {errors.time && <p className="text-xs text-red-600 mt-1">{errors.time}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Duration</label>
              <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                value={form.duration} onChange={(e) => handleChange("duration", e.target.value)}>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Timezone</label>
              <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                value={form.timezone} onChange={(e) => handleChange("timezone", e.target.value)}>
                {timezones.map(t => (<option key={t} value={t}>{t}</option>))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Meeting mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => handleChange("mode", "video")}
                className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                  form.mode === "video" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-300 bg-white text-gray-700"}`}>
                <Video size={18} /> Video call
              </button>
              <button type="button" onClick={() => handleChange("mode", "in_person")}
                className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                  form.mode === "in_person" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-300 bg-white text-gray-700"}`}>
                <MapIcon size={18} /> In person
              </button>
            </div>
          </div>
          {form.mode === "video" ? (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Call link</label>
              <div className="flex items-center gap-2">
                <div className="rounded-lg border border-gray-300 px-3 py-2 flex-1 flex items-center gap-2">
                  <LinkIcon size={16} className="text-gray-500" />
                  <input type="url" className="w-full text-sm focus:outline-none"
                    placeholder="https://meet.google.com/abc-defg-hij" value={form.link}
                    onChange={(e) => handleChange("link", e.target.value)} />
                </div>
              </div>
              {errors.link && <p className="text-xs text-red-600 mt-1">{errors.link}</p>}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
              <input type="text" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                placeholder="e.g., Avenida Julius Nyerere 123, Maputo" value={form.location}
                onChange={(e) => handleChange("location", e.target.value)} />
              {errors.location && <p className="text-xs text-red-600 mt-1">{errors.location}</p>}
            </div>
          )}
          {form.date && form.time && (
            <div className="rounded-lg border bg-gray-50 px-3 py-2 text-xs text-gray-700">
              <div className="flex items-center gap-2">
                <CalendarDays size={14} className="text-brand-600" />
                <span>
                  {new Date(`${form.date}T${form.time}:00`).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                  {" "}({form.timezone}) • {form.duration} min • {form.mode === "video" ? "Video call" : "In person"}
                </span>
              </div>
            </div>
          )}
        </form>
        <div className="p-4 border-t flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:border-gray-400">
            Cancel
          </button>
          <button type="submit" form="meetingForm" disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-60">
            <Clock size={18} /> {submitting ? "Creating…" : "Create request"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Página ---------------------------------- */
export default function PublicProfilePage() {
  const { userId } = useParams();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [crOpen, setCrOpen] = useState(false);
  const [openConfirmRemoveConnection, setOpenConfirmRemoveConnection] = useState(false);

  // state for blocking/reporting
  const [openConfirmBlock, setOpenConfirmBlock] = useState(false);
  const [openConfirmReport, setOpenConfirmReport] = useState(false);

  // Feed items state for Posts and activities section
  const [feedItems, setFeedItems] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showAllPosts, setShowAllPosts] = useState(false);

  // Share menu state
  const [shareOpen, setShareOpen] = useState(false);
  const shareMenuRef = useRef(null);
  const shareButtonRef = useRef(null);

  // Meeting modal + list
  const [mrOpen, setMrOpen] = useState(false);
  const [meetings, setMeetings] = useState([]);

  const data = useData();
  const { user } = useAuth();
  const navigate = useNavigate();

  function openCR() {
    if (!user) return data._showPopUp("login_prompt");
    setCrOpen(true);
  }
  function openMR() {
    if (!user) return data._showPopUp("login_prompt");
    setMrOpen(true);
  }

  const languages = useMemo(() => {
    if (!Array.isArray(profile?.languages)) return [];
    return profile.languages.map((l) => (typeof l === "string" ? { name: l } : l)).filter(Boolean);
  }, [profile]);

  useEffect(() => {
    if (!userId) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await client.get(`/users/${userId}/public`);
        if (mounted) setProfile(data);
      } catch (e) {
        console.error(e);
        if (mounted) setError("Failed to load profile.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [userId]);

  useEffect(() => {
    if (!userId || !user) return;
    async function loadMeetings() {
      try {
        const { data } = await client.get("/meeting-requests");
        const relevantMeetings = [
          ...data.received.filter((m) => m.fromUserId === userId),
          ...data.sent.filter((m) => m.toUserId === userId),
        ].filter((m) => m.status === "accepted");
        const formatted = relevantMeetings.map((m) => ({
          id: m.id,
          toUserId: userId,
          title: m.title,
          agenda: m.agenda,
          mode: m.mode,
          link: m.link,
          location: m.location,
          timezone: m.timezone,
          duration: m.duration,
          isoStart: m.scheduledAt,
          createdAt: m.createdAt,
          from: m.from,
          to: m.to,
        }));
        setMeetings(formatted);
      } catch (err) {
        console.error("Error loading meetings:", err);
      }
    }
    loadMeetings();
  }, [user?.id, userId]);

  // Load categories for feed items
  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get("/feed/meta");
        setCategories(data.categories || []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  // Load user's feed items when profile loads
  useEffect(() => {
    if (!userId) return;

    async function loadUserFeed() {
      setLoadingFeed(true);
      try {
        const params = {
          tab: "all",
          userId: userId,
          limit: 20,
          offset: 0,
        };

        const { data } = await client.get("/feed", { params });
        setFeedItems(data.items || []);
      } catch (error) {
        console.error("Error loading user feed:", error);
      } finally {
        setLoadingFeed(false);
      }
    }

    loadUserFeed();
  }, [userId]);

  // Close share menu on outside click / Esc
  useEffect(() => {
    function onDown(e) {
      if (
        shareButtonRef.current &&
        shareMenuRef.current &&
        !shareButtonRef.current.contains(e.target) &&
        !shareMenuRef.current.contains(e.target)
      ) {
        setShareOpen(false);
      }
    }
    function onEsc(e) {
      if (e.key === "Escape") setShareOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  function upsertMeetingList(newOne) {
    const updated = [newOne, ...meetings].sort((a, b) => new Date(b.isoStart) - new Date(a.isoStart));
    setMeetings(updated);
  }

  // handlers for blocking/reporting
  async function handleBlockUser(note) {
    if (!user) return data._showPopUp("login_prompt");
    await client.post(`/users/${userId}/block`, { note });
    setProfile(p => {
      const next = {
        ...p,
        block: { ...(p?.block || {}), iBlockedThem: true, status: "i_blocked" }
      };
      if (["connected","outgoing_pending","incoming_pending","pending","pending_outgoing","pending_incoming"].includes(p?.connectionStatus)) {
        next.connectionStatus = "none";
      }
      return next;
    });
    toast.success("User blocked");
  }

  async function handleUnblockUser() {
    if (!user) return data._showPopUp("login_prompt");
    await client.delete(`/users/${userId}/block`);
    setProfile(p => {
      const next = {
        ...p,
        block: { ...(p?.block || {}), iBlockedThem: false, status: "none" }
      };
      if (p?.connectionStatus === "blocked") next.connectionStatus = "none";
      return next;
    });
    toast.success("User unblocked");
  }

  async function handleReportUser(description) {
    if (!user) return data._showPopUp("login_prompt");
    await client.post(`/reports`, {
      targetType: "user",
      targetId: userId,
      description,
    });
    toast.success("Report submitted. Thanks for keeping the community safe.");
  }

  async function handleRemoveConnection(note) {
    if (!user) return data._showPopUp("login_prompt");
    try {
      await client.delete(`/connections/${userId}`, { data: { note } });
      setProfile((p) => ({ ...p, connectionStatus: "none" }));
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Failed to remove connection");
    }
  }

  const isUnblock = !!profile?.block?.iBlockedThem;

  // Render function for feed items (same as FeedExplorePage.jsx)
  const renderFeedItem = (item) => {
    // Render by kind while preserving order from API
    if (item.kind === "job") {
      return (
        <JobCard
          type="grid"
          key={`job-${item.id}`}
          matchPercentage={item.matchPercentage}
          job={{
            ...item,
            categoryName: categories.find((c) => String(c.id) === String(item.categoryId))?.name,
            subcategoryName: categories
              .find((c) => String(c.id) === String(item.categoryId))
              ?.subcategories?.find((s) => String(s.id) === String(item.subcategoryId))?.name,
          }}
        />
      );
    }
    if (item.kind === "need") {
      return (
        <NeedCard
          type="grid"
          key={`need-${item.id}`}
          matchPercentage={item.matchPercentage}
          need={{
            ...item,
            categoryName: categories.find((c) => String(c.id) === String(item.categoryId))?.name,
            subcategoryName: categories
              .find((c) => String(c.id) === String(item.categoryId))
              ?.subcategories?.find((s) => String(s.id) === String(item.subcategoryId))?.name,
          }}
        />
      );
    }
    if (item.kind === "service") {
      return <ServiceCard type="grid" key={`service-${item.id}`} item={item} matchPercentage={item.matchPercentage} currentUserId={user?.id} />;
    }
    if (item.kind === "product") {
      return <ProductCard type="grid" key={`product-${item.id}`} item={item} matchPercentage={item.matchPercentage} currentUserId={user?.id} />;
    }
    if (item.kind === "moment") {
      return (
        <MomentCard
          type="grid"
          key={`moment-${item.id}`}
          matchPercentage={item.matchPercentage}
          moment={{
            ...item,
            categoryName: categories.find((c) => String(c.id) === String(item.categoryId))?.name,
            subcategoryName: categories
              .find((c) => String(c.id) === String(item.categoryId))
              ?.subcategories?.find((s) => String(s.id) === String(item.subcategoryId))?.name,
          }}
        />
      );
    }
    if (item.kind === "tourism") {
      return <ExperienceCard type="grid" key={`tourism-${item.id}`} item={item} matchPercentage={item.matchPercentage} currentUserId={user?.id} />;
    }
    if (item.kind === "funding") {
      return <CrowdfundCard type="grid" key={`funding-${item.id}`} item={item} matchPercentage={item.matchPercentage} currentUserId={user?.id} />;
    }
    // default = event
    return <EventCard type="grid" key={`event-${item.id}`} item={item} e={item} matchPercentage={item.matchPercentage} />;
  };

  function renderConnectButton() {
    if (!profile) return null;
    if (profile.connectionStatus === "outgoing_pending") {
      return (
        <button className="col-span-1 rounded-lg px-3 py-2 text-sm font-medium bg-yellow-100 text-yellow-700 cursor-default">
          Pending request
        </button>
      );
    } else if (profile.connectionStatus === "incoming_pending") {
      return (
        <button
          onClick={() => navigate("/notifications")}
          className="col-span-1 items-center flex justify-center rounded-lg px-3 py-2 text-sm font-medium bg-brand-100 text-brand-600 cursor-pointer"
        >
          <ExternalLink size={16} className="mr-1" />
          Respond
        </button>
      );
    } else if (profile.connectionStatus === "connected") {
      return (
        <div className="col-span-1">
          <button
            onClick={() => setOpenConfirmRemoveConnection(true)}
            title="Connected — click to remove"
            aria-label="Connected. Click to remove connection"
            className="group/conn w-full inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold
                       bg-green-100 text-green-700 border border-green-200
                       hover:bg-red-50 hover:text-red-700 hover:border-red-300
                       focus:outline-none focus:ring-2 focus:ring-red-500/30
                       transition-all duration-200"
          >
            <span className="flex items-center gap-1">
              {/* Main icon/label swap */}
              <UserCheck size={14} className="block group-hover/conn:hidden group-focus/conn:hidden" />
              <UserX     size={14} className="hidden group-hover/conn:block group-focus/conn:block" />

              <span className="block group-hover/conn:hidden group-focus/conn:hidden">Connected</span>
              <span className="hidden group-hover/conn:block group-focus/conn:block">Remove</span>

              {/* Affordance: show delete icon BEFORE hover; show 'tap to remove' AFTER hover */}
              <span className="ml-1 inline-flex items-center">
                <Trash2
                  size={12}
                  className="block group-hover/conn:hidden group-focus/conn:hidden text-gray-500"
                  aria-hidden="true"
                />
                <span className="hidden group-hover/conn:inline group-focus/conn:inline text-[10px] leading-none text-gray-500">
                  tap to remove
                </span>
              </span>
            </span>
          </button>
        </div>
      );
    } else {
      return (
        <button
          onClick={openCR}
          className="col-span-1 rounded-lg px-3 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-colors"
        >
          Connect
        </button>
      );
    }
  }

  return (
     <DefaultLayout>
          <div className="min-h-screen bg-gray-50">
      {/* Cabeçalho simples da página (opcional, pode trocar pelo seu Header global) */}
     
      <Header/>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {loading && <div className="text-sm text-gray-600">Loading profile…</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}

        {!loading && !error && profile && (
          <>
            {/* Header do perfil (enhanced with better avatar handling and company memberships) */}
            <div className={`flex items-start gap-4 ${profile.accountType === "company" ? "bg-brand-50 p-4 rounded-lg border" : ""}`}>
              <div className="relative">
                {profile.avatarUrl ? (
                  <div className={`${profile.accountType === "company" ? "h-32 w-32 rounded-md" : "h-32 w-32 rounded-full"} border-4 border-white shadow-md bg-white flex justify-center items-center overflow-hidden`}>
                    <img
                      src={profile.avatarUrl}
                      alt={profile.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className={`${profile.accountType === "company" ? "h-32 w-32 rounded-md" : "h-32 w-32 rounded-full"} border-4 border-white shadow-md bg-brand-50 grid place-items-center overflow-hidden`}>
                    <span className="font-semibold text-brand-600 text-xl">
                      {getInitials(profile.name)}
                    </span>
                  </div>
                )}

                {/* Company logos for approved staff members */}
                {profile.companyMemberships && profile.companyMemberships.length > 0 && (
                  <div className="absolute -bottom-2 -right-2 flex -space-x-2">
                    {[...profile.companyMemberships]
                      .sort((a, b) => (b.isMain ? 1 : 0) - (a.isMain ? 1 : 0))
                      .slice(0, 3)
                      .map((membership, index) => (
                        membership.company.avatarUrl ? (
                          <img
                            key={membership.companyId}
                            src={membership.company.avatarUrl}
                            alt={membership.company.name}
                            className={`h-7 w-7 rounded-full border-2 border-white shadow-sm object-cover ${
                              membership.isMain ? 'ring-2 ring-brand-400' : ''
                            }`}
                            title={`${membership.company.name} (${membership.role})`}
                          />
                        ) : (
                          <div
                            key={membership.companyId}
                            className={`h-7 w-7 rounded-full border-2 border-white shadow-sm bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600 ${
                              membership.isMain ? 'ring-2 ring-brand-400' : ''
                            }`}
                            title={`${membership.company.name} (${membership.role})`}
                          >
                            {getInitials(membership.company.name)}
                          </div>
                        )
                      ))}
                    {profile.companyMemberships.length > 3 && (
                      <div className="h-7 w-7 rounded-full border-2 border-white shadow-sm bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600 z-10">
                        +{profile.companyMemberships.length - 3}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className={`${profile.accountType === "company" ? "text-2xl" : "text-xl"} font-semibold`}>{profile.name}</h2>
                  {profile.accountType && (
                    <Chip tone={profile.accountType === "company" ? "blue" : "gray"}>
                      {profile.accountType === "company" ? "Company" : "Individual"}
                    </Chip>
                  )}
                  {profile.primaryIdentity && <Chip tone="brand">{profile.primaryIdentity}</Chip>}
                  {profile.experienceLevel && <Chip tone="gray">{profile.experienceLevel}</Chip>}
                </div>

                {profile.accountType === "company" ? (
                  <div className="mt-1">
                    <p className="text-sm font-medium text-brand-600">
                      {profile.professionalTitle || (profile.categories && profile.categories.length > 0 ? profile.categories.join(", ") : "Company")}
                    </p>
                    {profile.categories && profile.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {profile.categories.map((cat, idx) => (
                          <Chip key={`cat-${idx}`} tone="brand">{cat}</Chip>
                        ))}
                        {profile.subcategories && profile.subcategories.map((subcat, idx) => (
                          <Chip key={`subcat-${idx}`} tone="gray">{subcat}</Chip>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm font-medium text-brand-600 mt-1">
                    {profile.professionalTitle || profile.title || "—"}
                  </p>
                )}
                {(profile.city || profile.country) && (
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <MapPin size={14} /> {fmtLoc(profile.city, profile.country)}
                  </p>
                )}
              </div>
            </div>

            {/* About - Enhanced for companies */}
            {profile.about && (
              <Section title="About" icon={User2}>
                <p className={`text-sm text-gray-700 ${profile.accountType === "company" ? "bg-white p-3 rounded border border-gray-100" : ""}`}>
                  {profile.about}
                </p>

                {/* For companies, show skills as "Expertise" */}
                {profile.accountType === "company" && profile.skills && profile.skills.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-500 mb-1">Company Expertise:</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill, idx) => (
                        <Chip key={`skill-${idx}`} tone="green">{skill}</Chip>
                      ))}
                    </div>
                  </div>
                )}
              </Section>
            )}

            {/* Work Samples - Moved to be right after About */}
            {Array.isArray(profile.workSamples) && profile.workSamples.length > 0 && (
              <Section title="Work Samples" icon={Briefcase}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {profile.workSamples.map(ws => (
                    <div key={ws.id} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">{ws.title}</div>

                          {ws.category && (
                            <div className="mt-1">
                              <Chip tone="brand">{ws.category}</Chip>
                            </div>
                          )}

                          {Array.isArray(ws.technologies) && ws.technologies.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {ws.technologies.slice(0, 6).map((t, i) => (
                                <Chip key={`${ws.id}-tech-${i}`} tone="gray">{t}</Chip>
                              ))}
                              {ws.technologies.length > 6 && (
                                <span className="text-[11px] text-gray-500">+{ws.technologies.length - 6} more</span>
                              )}
                            </div>
                          )}

                          {ws.description && (
                            <p className="mt-2 text-xs text-gray-600 line-clamp-3">{ws.description}</p>
                          )}

                          <div className="mt-2 text-[11px] text-gray-500">
                            {ws.completionDate ? new Date(ws.completionDate).toLocaleDateString() : null}
                            {ws.createdAt ? ` • added ${timeAgo(ws.createdAt)}` : null}
                          </div>
                        </div>
                      </div>

                      {/* Attachments */}
                      {Array.isArray(ws.attachments) && ws.attachments.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {/* Image attachments grid */}
                          <div className="grid grid-cols-3 gap-2">
                            {ws.attachments
                              .filter(a => a?.isImage)
                              .map((a, idx) => {
                                const src = a.base64url || a.url;
                                if (!src) return null;
                                return (
                                  <a
                                    key={`${ws.id}-img-${idx}`}
                                    href={src}
                                    target="_blank"
                                    rel="noreferrer"
                                    title={a.name || "Image"}
                                    className="block"
                                  >
                                    <img
                                      src={src}
                                      alt={a.name || ws.title}
                                      className="w-full h-24 object-cover rounded-md border"
                                      loading="lazy"
                                    />
                                  </a>
                                );
                              })}
                          </div>

                          {/* Document attachments list */}
                          <div className="flex flex-col gap-1">
                            {ws.attachments
                              .filter(a => !a?.isImage)
                              .map((a, idx) => {
                                const href = a.base64url || a.url || "#";
                                const filename = a.name || "document";
                                return (
                                  <a
                                    key={`${ws.id}-doc-${idx}`}
                                    href={href}
                                    target="_blank"
                                    rel="noreferrer"
                                    download={filename}
                                    className="inline-flex items-center gap-2 text-xs font-medium text-brand-700 underline"
                                    title={filename}
                                  >
                                    <ExternalLink size={14} />
                                    <span className="truncate max-w-[14rem]">{filename}</span>
                                  </a>
                                );
                              })}
                          </div>
                        </div>
                      )}

                      {/* Optional project link */}
                      {ws.projectUrl && (
                        <div className="mt-3">
                          <a
                            href={ws.projectUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 underline"
                          >
                            <ExternalLink size={14} /> View project
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Contact */}
            {(profile.email || profile.website || (Array.isArray(profile.links) && profile.links.length)) && (
              <Section title="Contact" icon={User2}>
                <div className="text-sm text-gray-700 space-y-1">
                  {profile.email && <div>📧 {profile.email}</div>}
                  {profile.website && (
                    <div>
                      🔗 <a href={profile.website} target="_blank" rel="noreferrer" className="underline text-brand-700">{profile.website}</a>
                    </div>
                  )}
                  {Array.isArray(profile.links) &&
                    profile.links.map((l, i) => (
                      <div key={i}>
                        🔗 <a href={l} target="_blank" rel="noreferrer" className="underline text-brand-700">{l}</a>
                      </div>
                    ))}
                </div>
              </Section>
            )}

            {/* Looking For */}
            {Array.isArray(profile.lookingFor) && profile.lookingFor.length > 0 && (
              <Section title="Looking For" icon={Target}>
                <div className="flex flex-wrap gap-2">
                  {profile.lookingFor.map((g, i) => (
                    <Chip key={`${g}-${i}`} tone="green">{g}</Chip>
                  ))}
                </div>
              </Section>
            )}

            {/* Identities */}
            {Array.isArray(profile.identities) && profile.identities.length > 0 && (
              <Section title={profile.accountType === "company" ? "Company Identity" : "Identities"} icon={User2}>
                <div className="flex flex-wrap gap-2">
                  {profile.identities.map((idn, i) => (
                    <Chip key={`ident-${i}`} tone="blue">{idn}</Chip>
                  ))}
                </div>
              </Section>
            )}

            {/* Posts and activities */}
            {feedItems.length > 0 && (
              <Section title="Posts and activities" icon={Activity}>
                <div className="space-y-4">
                  {loadingFeed ? (
                    <div className="text-sm text-gray-600">Loading posts...</div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {showAllPosts
                          ? feedItems.map(renderFeedItem)
                          : feedItems.slice(0, 4).map(renderFeedItem)
                        }
                      </div>

                      {feedItems.length > 4 && (
                        <div className="flex justify-center pt-2">
                          <button
                            onClick={() => setShowAllPosts(!showAllPosts)}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors duration-200"
                          >
                            <span>
                              {showAllPosts
                                ? `View Less`
                                : `View All ${feedItems.length} posts`
                              }
                            </span>
                            <ExternalLink size={16} className={`transition-transform duration-200 ${showAllPosts ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </Section>
            )}

            {/* Interests */}
            {profile.interests && (
              <Section title={profile.accountType === "company" ? "Company Interests" : "Identity Interests"} icon={Target}>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.identities && profile.interests.identities.length > 0 ? (
                    profile.interests.identities.map((idn, i) => (
                      <Chip key={`ident-int-${i}`} tone="green">{idn}</Chip>
                    ))
                  ) : Array.isArray(profile.identityInterests) && profile.identityInterests.length > 0 ? (
                    profile.identityInterests.map((idn, i) => (
                      <Chip key={`old-ident-int-${i}`} tone="green">{idn}</Chip>
                    ))
                  ) : null}
                  {profile.interests.categories && profile.interests.categories.length > 0 &&
                    profile.interests.categories.map((cat, i) => (
                      <Chip key={`cat-int-${i}`} tone="brand">{cat}</Chip>
                    ))}
                  {profile.interests.subcategories && profile.interests.subcategories.length > 0 &&
                    profile.interests.subcategories.map((sub, i) => (
                      <Chip key={`sub-int-${i}`} tone="gray">{sub}</Chip>
                    ))}
                </div>
              </Section>
            )}

            {/* Expertise & Interests */}
            {(profile.cats?.length || profile.subs?.length) ? (
              <Section title="Expertise & Interests" icon={Layers}>
                <div className="flex flex-wrap gap-2">
                  {(profile.cats || []).map((c) => (<Chip key={`cat-${c}`} tone="brand">{c}</Chip>))}
                  {(profile.subs || []).map((s) => (<Chip key={`sub-${s}`} tone="gray">{s}</Chip>))}
                </div>
              </Section>
            ) : null}

            {/* Specialties */}
            {Array.isArray(profile.subsubs) && profile.subsubs.length > 0 && (
              <Section title="Specialties" icon={Layers}>
                <div className="flex flex-wrap gap-2">
                  {profile.subsubs.map((s3, i) => (<Chip key={`s3-${i}`} tone="gray">{s3}</Chip>))}
                </div>
              </Section>
            )}

            {/* Skills */}
            {Array.isArray(profile.skills) && profile.skills.length > 0 && (
              <Section title="Skills" icon={Hash}>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((s, i) => (<Chip key={`${s}-${i}`} tone="gray">{s}</Chip>))}
                </div>
              </Section>
            )}

            {/* Languages */}
            {languages.length > 0 && (
              <Section title={profile.accountType === "company" ? "Working Languages" : "Languages"} icon={Languages}>
                <div className="flex flex-wrap gap-2">
                  {languages.map((l, i) => (
                    <Chip key={`${l.name}-${i}`} tone={profile.accountType === "company" ? "blue" : "gray"}>
                      {l.name}{l.level ? ` • ${l.level}` : ""}
                    </Chip>
                  ))}
                </div>
              </Section>
            )}

            {/* Overview */}
            {(profile.stats || profile.counts || profile.connections?.count || profile.requests?.incoming?.length || profile.requests?.outgoing?.length) && (
              <Section title="Overview" icon={Star}>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                  {(() => {
                    const parts = [];
                    const counts = profile.counts || {};
                    const add = (label, value) => {
                      if (typeof value === "number") {
                        parts.push(
                          <div key={label}>
                            <p className="font-semibold text-brand-600">{value}</p>
                            <p className="text-gray-500 text-xs">{label}</p>
                          </div>
                        );
                      }
                    };
                    add("Jobs", counts.jobs ?? profile.recent?.jobs?.length);
                    add("Events", counts.events ?? profile.recent?.events?.length);
                    add("Funding", counts.funding ?? profile.recent?.funding?.length);
                    add("Services", counts.services ?? profile.recent?.services?.length);
                    add("Products", counts.products ?? profile.recent?.products?.length);
                    add("Tourism posts", counts.tourism ?? profile.recent?.tourism?.length);
                    add("Connections", profile.connections?.count);
                    add("Incoming requests", profile.requests?.incoming?.length);
                    add("Outgoing requests", profile.requests?.outgoing?.length);
                    return parts;
                  })()}
                </div>
              </Section>
            )}

            {/* Recent Activity: Jobs & Events */}
            {(profile.recent?.jobs?.length || profile.recent?.events?.length) ? (
              <Section title="Recent Activity" icon={Star}>
                <div className="space-y-3">
                  {(profile.recent.jobs || []).map((j) => (
                    <div key={`job-${j.id}`} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm">{j.title}</div>
                        <div className="text-[11px] text-gray-500">{timeAgo(j.createdAt)}</div>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {j.companyName || "—"} • {fmtLoc(j.city, j.country)}
                      </div>
                      {(j.categoryName || j.subcategoryName) && (
                        <div className="mt-1 flex gap-1 flex-wrap">
                          {j.categoryName && <Chip tone="brand">{j.categoryName}</Chip>}
                          {j.subcategoryName && <Chip tone="gray">{j.subcategoryName}</Chip>}
                        </div>
                      )}
                      <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-gray-500">
                        <Briefcase size={14} /> Job
                      </div>
                    </div>
                  ))}
                  {(profile.recent.events || []).map((e) => (
                    <div key={`event-${e.id}`} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm">{e.title}</div>
                        <div className="text-[11px] text-gray-500">{timeAgo(e.createdAt)}</div>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{fmtLoc(e.city, e.country)}</div>
                      {(e.categoryName || e.subcategoryName) && (
                        <div className="mt-1 flex gap-1 flex-wrap">
                          {e.categoryName && <Chip tone="brand">{e.categoryName}</Chip>}
                          {e.subcategoryName && <Chip tone="gray">{e.subcategoryName}</Chip>}
                        </div>
                      )}
                      <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-gray-500">
                        <CalendarDays size={14} /> Event
                        {e.registrationType === "Paid" && typeof e.price !== "undefined" ? (
                          <span className="ml-2">• {e.currency || ""}{e.price}</span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            ) : null}

            {/* Recent Funding */}
            {Array.isArray(profile.recent?.funding) && profile.recent.funding.length > 0 && (
              <Section title="Recent Funding Projects" icon={Briefcase}>
                <div className="space-y-3">
                  {profile.recent.funding.map((f) => (
                    <div key={`fund-${f.id}`} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm">{f.title}</div>
                        <div className="text-[11px] text-gray-500">{timeAgo(f.createdAt)}</div>
                      </div>
                      <div className="text-xs text-gray-600 mt-0.5">
                        {typeof f.goal !== "undefined" && (<span>Goal: {f.currency || ""}{f.goal}</span>)}
                        {typeof f.raised !== "undefined" && (<span className="ml-2">• Raised: {f.currency || ""}{f.raised}</span>)}
                        {(f.city || f.country) ? (<span className="ml-2">• {fmtLoc(f.city, f.country)}</span>) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Recent Services */}
            {Array.isArray(profile.recent?.services) && profile.recent.services.length > 0 && (
              <Section title="Recent Services" icon={Briefcase}>
                <div className="space-y-3">
                  {profile.recent.services.map((s) => (
                    <div key={`svc-${s.id}`} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm">{s.title}</div>
                        <div className="text-[11px] text-gray-500">{timeAgo(s.createdAt)}</div>
                      </div>
                      <div className="text-xs text-gray-600 mt-0.5">
                        {s.serviceType || "Service"}{s.priceAmount ? ` • ${s.priceAmount} ${s.currency || ""}` : ""}
                        {(s.city || s.country) ? ` • ${fmtLoc(s.city, s.country)}` : ""}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Recent Products */}
            {Array.isArray(profile.recent?.products) && profile.recent.products.length > 0 && (
              <Section title="Recent Products" icon={Briefcase}>
                <div className="space-y-3">
                  {profile.recent.products.map((p) => (
                    <div key={`prd-${p.id}`} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm">{p.title}</div>
                        <div className="text-[11px] text-gray-500">{timeAgo(p.createdAt)}</div>
                      </div>
                      <div className="text-xs text-gray-600 mt-0.5">
                        {typeof p.price !== "undefined" ? `Price: ${p.price} ${p.currency || ""}` : "Product"}
                        {p.country ? ` • ${p.country}` : ""}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Recent Tourism */}
            {Array.isArray(profile.recent?.tourism) && profile.recent.tourism.length > 0 && (
              <Section title="Recent Tourism Posts" icon={Star}>
                <div className="space-y-3">
                  {profile.recent.tourism.map((t) => (
                    <div key={`tour-${t.id}`} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm">{t.title}</div>
                        <div className="text-[11px] text-gray-500">{timeAgo(t.createdAt)}</div>
                      </div>
                      <div className="text-xs text-gray-600 mt-0.5">
                        {t.postType || "Destination"} • {t.location || t.country || "—"}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Meetings */}
            <Section title="Meetings" icon={CalendarDays}>
              {profile.meetings && profile.meetings.length > 0 ? (
                <div className="space-y-3">
                  {profile.meetings.map((m) => {
                    const joinable = m.mode === "video" && isJoinWindow(m.scheduledAt, m.duration);
                    const now = Date.now();
                    let start, end, status;
                    try {
                      const startDate = new Date(m.scheduledAt);
                      if (!isNaN(startDate.getTime())) {
                        start = startDate.getTime();
                        const endTimeStr = addMinutes(m.scheduledAt, Number(m.duration) || 30);
                        end = endTimeStr ? new Date(endTimeStr).getTime() : start + (Number(m.duration) || 30) * 60 * 1000;
                        status = now < start ? "Upcoming" : now > end ? "Ended" : "Ongoing";
                      } else {
                        status = "Upcoming";
                      }
                    } catch {
                      status = "Upcoming";
                    }
                    return (
                      <div key={m.id} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="font-medium text-sm truncate">{m.title || "Untitled meeting"}</div>
                              <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                                status === "Upcoming" ? "bg-blue-50 text-blue-700"
                                : status === "Ongoing" ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"}`}>{status}</span>
                            </div>
                            <div className="text-xs text-gray-600 mt-0.5">
                              {humanWhen(m.scheduledAt, m.timezone, m.duration)} • {m.mode === "video" ? "Online" : "In person"}
                            </div>
                            {m.mode === "in_person" && m.location ? (
                              <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">📍 {m.location}</div>
                            ) : null}
                            {m.mode === "video" && m.link ? (
                              <div className="text-xs text-gray-500 mt-0.5 truncate">🔗 {m.link}</div>
                            ) : null}
                            {m.agenda ? (
                              <div className="text-xs text-gray-500 mt-1 line-clamp-2">📝 {m.agenda}</div>
                            ) : null}
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex -space-x-2">
                                {m.from && (
                                  <img src={m.from.avatarUrl || "https://i.pravatar.cc/150"} alt={m.from.name}
                                    className="h-6 w-6 rounded-full border border-white" title={m.from.name} />
                                )}
                                {m.to && (
                                  <img src={m.to.avatarUrl || "https://i.pravatar.cc/150"} alt={m.to.name}
                                    className="h-6 w-6 rounded-full border border-white" title={m.to.name} />
                                )}
                              </div>
                              <span className="text-xs text-gray-500">
                                {m.from?.name || "User"} and {m.to?.name || "User"}
                              </span>
                            </div>
                          </div>
                          <div className="shrink-0 flex items-center gap-2">
                            {m.mode === "video" ? (
                              <a href={m.link || "#"} target="_blank" rel="noreferrer"
                                title={joinable ? "Open call link" : `Join opens 10 min before start`}
                                className={`inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium ${
                                  joinable ? "bg-brand-500 text-white hover:bg-brand-600" : "bg-gray-100 text-gray-500 cursor-not-allowed"}`}
                                onClick={(e) => { if (!joinable) e.preventDefault(); }}>
                                Join
                              </a>
                            ) : m.location ? (
                              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.location)}`}
                                target="_blank" rel="noreferrer"
                                className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium bg-brand-50 text-brand-700 hover:bg-brand-100">
                                Open Map
                              </a>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : meetings.length === 0 ? (
                <div className="text-sm text-gray-600">No meetings yet. Create one from the button below.</div>
              ) : (
                <div className="space-y-3">
                  {meetings.map((m) => {
                    const joinable = m.mode === "video" && isJoinWindow(m.isoStart, m.duration);
                    const now = Date.now();
                    let start, end, status;
                    try {
                      const startDate = new Date(m.isoStart);
                      if (!isNaN(startDate.getTime())) {
                        start = startDate.getTime();
                        const endTimeStr = addMinutes(m.isoStart, Number(m.duration) || 30);
                        end = endTimeStr ? new Date(endTimeStr).getTime() : start + (Number(m.duration) || 30) * 60 * 1000;
                        status = now < start ? "Upcoming" : now > end ? "Ended" : "Ongoing";
                      } else {
                        status = "Upcoming";
                      }
                    } catch {
                      status = "Upcoming";
                    }
                    return (
                      <div key={m.id} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="font-medium text-sm truncate">{m.title || "Untitled meeting"}</div>
                              <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                                status === "Upcoming" ? "bg-blue-50 text-blue-700"
                                : status === "Ongoing" ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"}`}>{status}</span>
                            </div>
                            <div className="text-xs text-gray-600 mt-0.5">
                              {humanWhen(m.isoStart, m.timezone, m.duration)} • {m.mode === "video" ? "Online" : "In person"}
                            </div>
                            {m.mode === "in_person" && m.location ? (
                              <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">📍 {m.location}</div>
                            ) : null}
                            {m.mode === "video" && m.link ? (
                              <div className="text-xs text-gray-500 mt-0.5 truncate">🔗 {m.link}</div>
                            ) : null}
                            {m.agenda ? (
                              <div className="text-xs text-gray-500 mt-1 line-clamp-2">📝 {m.agenda}</div>
                            ) : null}
                          </div>
                          <div className="shrink-0 flex items-center gap-2">
                            {m.mode === "video" ? (
                              <a href={m.link || "#"} target="_blank" rel="noreferrer"
                                title={joinable ? "Open call link" : `Join opens 10 min before start`}
                                className={`inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium ${
                                  joinable ? "bg-brand-500 text-white hover:bg-brand-600" : "bg-gray-100 text-gray-500 cursor-not-allowed"}`}
                                onClick={(e) => { if (!joinable) e.preventDefault(); }}>
                                Join
                              </a>
                            ) : m.location ? (
                              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.location)}`}
                                target="_blank" rel="noreferrer"
                                className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium bg-brand-50 text-brand-700 hover:bg-brand-100">
                                Open Map
                              </a>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Section>

            {/* Meta */}
            <div className="mt-6 text-xs text-gray-500">
              Member since {new Date(profile.memberSince).toLocaleDateString()} • {timeAgo(profile.memberSince)}
            </div>

            {/* Block/Report section */}
            <div className="flex items-center gap-2 my-4">
              {/* NEW: Block / Report with text labels */}
              {user && <button
                onClick={() => (isUnblock ? handleUnblockUser() : setOpenConfirmBlock(true))}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-all
                  ${isUnblock
                    ? "border border-red-300 text-red-700 bg-red-50 hover:bg-red-100"
                    : "border-2 border-gray-200 text-gray-700 bg-white hover:border-red-300 hover:text-red-700 hover:bg-red-50"}`}
                aria-label={isUnblock ? "Unblock user" : "Block user"}
                title={isUnblock ? "Unblock user" : "Block user"}
              >
                <ShieldBan size={16} />
                <span>{isUnblock ? "Unblock user" : "Block user"}</span>
              </button>}

              <button
                onClick={() => setOpenConfirmReport(true)}
                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium border-2 border-gray-200 text-gray-700 bg-white hover:border-amber-300 hover:text-amber-700 hover:bg-amber-50 transition-all"
                aria-label="Report user"
                title="Report user"
              >
                <Flag size={16}/>
                <span>Report user</span>
              </button>
            </div>

            {/* Actions */}
            <div className={`grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6 relative ${isUnblock ? 'hidden':''}`}>
              {/* Share Menu */}
              {shareOpen && <ShareMenu profile={profile} shareMenuRef={shareMenuRef} setShareOpen={setShareOpen} />}

              {/* Share */}
              <button
                ref={shareButtonRef}
                onClick={(e) => {
                  e.stopPropagation();
                  setShareOpen((s) => !s);
                }}
                className="col-span-1 inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:border-brand-500 hover:text-brand-600 transition-colors"
              >
                <Share2 size={16} />
                <span>Share</span>
              </button>

              <button
                onClick={() => {
                  if (!user) {
                    data._showPopUp("login_prompt");
                    return;
                  }
                  navigate(`/profile/${userId}`);
                }}
                className="col-span-1 rounded-lg px-3 py-2 text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:border-brand-500 hover:text-brand-600 transition-colors"
              >
                View Full Profile
              </button>
              {renderConnectButton()}
              {(profile?.connectionStatus=="connected" &&  (!profile?.block?.iBlockedThem && !profile?.block?.theyBlockedMe)) &&  <button
                onClick={openMR}
                className="col-span-1 inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium border border-brand-200 bg-white text-brand-700 hover:border-brand-500 hover:text-brand-700 transition-colors"
              >
                <CalendarDays size={16} className="mr-1" />
                Request Meeting
              </button>}

              <button
                onClick={() => {
                  if (!user) {
                    data._showPopUp("login_prompt");
                    return;
                  }
                  navigate(`/messages?userId=${userId}`);
                  toast.success("Starting conversation with " + profile.name);
                }}
                className="col-span-1 rounded-lg px-3 py-2 text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:border-brand-500 hover:text-brand-600 transition-colors"
              >
                Message
              </button>
            </div>
          </>
        )}
      </div>

      {/* Modais */}
      <ConnectionRequestModal
        open={crOpen}
        onClose={() => setCrOpen(false)}
        toUserId={userId}
        toName={profile?.name}
        onSent={() => {
          setProfile({ ...profile, connectionStatus: "outgoing_pending" });
        }}
      />

      <MeetingRequestModal
        open={mrOpen}
        onClose={() => setMrOpen(false)}
        toUserId={userId}
        toName={profile?.name}
        onCreated={(m) => {
          upsertMeetingList(m); // add to local list for immediate render
        }}
      />

      <ConfirmDialog
        open={openConfirmRemoveConnection}
        onClose={() => setOpenConfirmRemoveConnection(false)}
        title="Remove this connection?"
        text="This action will remove the connection. You can send a new request later."
        confirmText="Remove"
        cancelText="Cancel"
        tone="danger"
        withInput={true}
        inputLabel="Optional reason"
        inputPlaceholder="Why are you removing this connection?"
        inputType="textarea"
        requireValue={false}
        onConfirm={handleRemoveConnection}
        onResult={(r) => {
         toast.success("Connection removed");
        }}
      />

      {/* Block dialog */}
      <ConfirmDialog
        open={openConfirmBlock}
        onClose={() => setOpenConfirmBlock(false)}
        title="Block this user?"
        text="They won't be able to message or connect with you. Any connection and pending requests will be removed."
        confirmText="Block"
        cancelText="Cancel"
        tone="danger"
        withInput={true}
        inputLabel="Optional note"
        inputPlaceholder="Why are you blocking this user?"
        inputType="textarea"
        requireValue={false}
        onConfirm={handleBlockUser}
      />

      {/* Report dialog */}
      <ConfirmDialog
        open={openConfirmReport}
        onClose={() => setOpenConfirmReport(false)}
        title="Report this user?"
        text="Tell us what's going on. Our team will review."
        confirmText="Submit report"
        cancelText="Cancel"
        tone="default"
        withInput={true}
        inputLabel="Report details"
        inputPlaceholder="Describe the issue (spam, harassment, impersonation, etc.)"
        inputType="textarea"
        requireValue={true}
        onConfirm={handleReportUser}
      />
    </div>
     </DefaultLayout>
  );
}
