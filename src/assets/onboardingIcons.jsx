// src/assets/onboardingIcons.jsx
import React from "react";
import {
  User, BriefcaseBusiness, Store, ShoppingCart, GraduationCap, Users, Handshake, Landmark,
  Rocket, CalendarRange, BadgeCheck, MapPin, HeartHandshake, Building2, Coins, Factory,
  HardHat, Hammer, Banknote, CreditCard, Presentation, BadgeDollarSign, ShieldCheck, Cpu,
  Wrench, Bot, Database, Shield, Radio, Shirt, Footprints, Sparkles, Car, WrenchIcon,
  Film, Radio as RadioIcon, Gamepad2, BookOpenText, MicVocal, Leaf, Droplets, Flame,
  Fuel, Ship, Plane, Bus, Hotel, Globe2, Trees, Camera, Palette, Music2, Drama, Paintbrush,
  Stethoscope, Pill, Dna, Activity, Syringe, Scale, FileSpreadsheet, Users2, ClipboardCheck,
  Building, GraduationCap as StudentCap, BadgePercent, DollarSign, Search, Compass, Network,
  MessageSquareQuote, BookMarked, MapPinned, UsersRound, Trophy, Target, BadgePlus, ScanSearch,
  Lightbulb, Building as RealEstate, LayoutGrid, Blocks, Globe, Newspaper, Megaphone,
} from "lucide-react";

/** Small helper to render an icon with consistent sizing */
export const I = (Comp, cls = "h-5 w-5") => <Comp className={cls} aria-hidden />;

/** Profile Types (Who You Are) */
export const PROFILE_TYPE_ICONS = {
  "Entrepreneur":            I(Rocket),
  "Seller":                  I(Store),
  "Buyer":                   I(ShoppingCart),
  "Job Seeker":              I(Search),
  "Professional":            I(BriefcaseBusiness),
  "Partnership":             I(Handshake),
  "Investor":                I(Coins),
  "Event Organizer":         I(CalendarRange),
  "Government Official":     I(Landmark),
  "Traveler":                I(MapPin),
  "NGO":                     I(HeartHandshake),
  "Support Role":            I(Users2),
  "Freelancer":              I(Users),
  "Student":                 I(StudentCap),
};

/** Categories (Industries) — top-level only need icons */
export const CATEGORY_ICONS = {
  "Agriculture":                 I(Leaf),
  "Energy":                      I(Flame),
  "Manufacturing":               I(Factory),
  "Infrastructure & Construction": I(HardHat),
  "Commerce & Financial Services": I(Banknote),
  "E-Commerce":                  I(CreditCard),
  "Technology":                  I(Cpu),
  "Fashion":                     I(Shirt),
  "Oil & Gas":                   I(Fuel),
  "Automobile":                  I(Car),
  "Media & Entertainment":       I(Film),
  "Marketing & Advertising":     I(Megaphone),
  "Education":                   I(GraduationCap),
  "Health & Health Services":    I(Stethoscope),
  "Maritime & Transport":        I(Ship),
  "Tourism & Hospitality":       I(Hotel),
  "Arts & Culture":              I(Palette),
  "Beauty & Cosmetics":          I(Sparkles),
  "Public Sector":               I(Building2),
  "Professional Services":       I(ClipboardCheck),
  "Students":                    I(StudentCap),
  "Support Role":                I(UsersRound),
  "Others. Pls specify —--------------------": I(QuestionMarkIconPlaceholder),
};
// Fallback placeholder (simple circle). You can also import HelpCircle if you prefer.
function QuestionMarkIconPlaceholder(props){return <div className="h-5 w-5 rounded-full bg-gray-200" {...props}/>}

/** Goals (What Are You Looking For?) */
export const GOAL_ICONS = {
  "Funding":                     I(DollarSign),
  "Job opportunities":           I(BriefcaseBusiness),
  "Job seekers":                 I(Search),
  "Freelancers":                 I(Users),
  "Internship":                  I(GraduationCap),
  "Services providers":          I(Wrench),
  "Investors":                   I(Coins),
  "Grants":                      I(BadgePercent),
  "Tourist guide":               I(MapPinned),
  "Events":                      I(CalendarRange),
  "Scholarship":                 I(GraduationCap),
  "Career guide":                I(Compass),
  "Networking":                  I(Network),
  "Training":                    I(Presentation),
  "Mentorship/Coaching":         I(BadgeCheck),
  "Franchising":                 I(BadgePlus),
  "Expanding into a new market": I(Globe2),
  "Partnership":                 I(Handshake),
  "Products":                    I(Blocks),
  "students":                    I(StudentCap),
  "Professionals":               I(BriefcaseBusiness),
  "Social entrepreneurs/ NGOs":  I(HeartHandshake),
  "Volunteer opportunity":       I(HandsIconPlaceholder),
  "Research/ project collaborators": I(Lightbulb),
  "Services providers":          I(Wrench),
};
// Minimal placeholder for “Volunteer opportunity”
function HandsIconPlaceholder(props){return <div className="h-4 w-6 rounded bg-gray-200" {...props}/>}

/** Safe getter with fallback */
export const getIcon = (map, key, fallback = I(LayoutGrid)) =>
  map?.[key] || fallback;
