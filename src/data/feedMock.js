// src/data/feedMock.js
export const posts = [
  {
    id: 1,
    author: "Kwame Asante",
    subtitle: "Tech Lead • Accra, Ghana • 2h",
    text: "Looking for React developers for an innovative fintech project. Remote-friendly. #ReactJS #Fintech #RemoteWork",
    stats: { likes: 24, comments: 8, shares: 3 },
    image: null,
  },
  {
    id: 2,
    author: "Amara Diallo",
    subtitle: "Marketing Consultant • Lagos, Nigeria • 4h",
    text: "Networking event in Lagos next week! Connect with entrepreneurs and investors. Limited seats.",
    stats: { likes: 42, comments: 15, shares: 8 },
    image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: 3,
    author: "Amara Okafor",
    subtitle: "Software Developer • 4h",
    text: "Just shipped a mobile app connecting farmers to buyers. Seeking partnerships to scale across West Africa.",
    stats: { likes: 67, comments: 15, shares: 6 },
    image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1600&auto=format&fit=crop",
  },
];

export const suggestions = [
  { name: "Michael Chen", role: "Angel Investor", tag: "Fintech Startups" },
  { name: "Lisa Ndovu", role: "CTO", tag: "Partnerships" },
  { name: "Laura Costa", role: "Product Manager", tag: "User Feedback" },
];

export const nearby = [
  { name: "Omar Hassan", role: "Data Scientist • Nigeria" },
  { name: "Fatima Al-Rashid", role: "Marketing Director • Nigeria" },
  { name: "James Ochieng", role: "Investor • Nigeria" },
  { name: "Amina Hassan", role: "Tech Entrepreneur • Nigeria" },
];
