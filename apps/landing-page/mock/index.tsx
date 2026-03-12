import { getAuthServiceUrl } from "@volteryde/config";

// Footer 

export const quickLinks = [
  { href: "/", label: "Home" },
  { href: "#board", label: "About Us" },
  { href: "#download", label: "Download App" },
] as const;

export const contactItems = [
  {
    label: "Email:",
    href: "mailto:info@volteryde.com",
    text: "info@volteryde.com",
  },
  { label: "Phone:", href: "tel:+233534544454", text: "(233) 534544454" },
] as const;

export const socialLinks = [
  {
    href: "https://www.linkedin.com/company/volteryde/",
    label: "LinkedIn",
    iconSrc: "/icons/linkedin.svg",
    iconAlt: "LinkedIn",
    external: true,
  },
  {
    href: "mailto:info@volteryde.com",
    label: "Chat",
    iconSrc: "/icons/message.svg",
    iconAlt: "Email",
    external: false,
  },
  {
    href: "https://x.com/volteryde?s=20",
    label: "Twitter/X",
    iconSrc: "/icons/x.svg",
    iconAlt: "X (Twitter)",
    external: true,
  },
] as const;

export const bottomLinks = [
  {
    href: "/terms",
    label: "Terms & conditions",
    external: false,
  },
  {
    href: getAuthServiceUrl(),
    label: "Employee Portal",
    external: true,
  },
] as const;

//  Navbar 

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/#board", label: "About Us" },
] as const;

export const DOWNLOAD_LINK = { href: "/#download", label: "Download App" } as const;

// Board Section

export interface BoardMember {
  name: string;
  title: string;
  image: string;
}

export const boardMembers: BoardMember[] = [
  {
    name: "Austin Bediako",
    title: "CEO/Founder",
    image: "/team/Austin.png",
  },
  {
    name: "Kenny Idan",
    title: "Chief Marketing Officer",
    image: "/team/Kenny.png",
  },
  {
    name: "Theophilus K. Dadzie",
    title: "Chief Technology Officer",
    image: "/team/Theophilus.jpg",
  },
  {
    name: "Edmond Seyram Gbordzor",
    title: "Chief Operating Officer",
    image: "/team/Edmond.jpg",
  },
];

// Team Section 

export interface TeamMember {
  name: string;
  title: string;
  image: string;
}

export const realTeamMembers: TeamMember[] = [
  {
    name: "Adjei Caleb",
    title: "Design Lead",
    image: "/team/caleb.png",
  },
  {
    name: "Phineas Boketey",
    title: "Project Manager",
    image: "/team/Phineas.png",
  },
  {
    name: "Prince Phil",
    title: "Role",
    image: "/team/Phil.png",
  },
  {
    name: "Michelle Fynn",
    title: "Business development and strategy lead",
    image: "/team/Michelle.png",
  },
  {
    name: "Edward Sarfo",
    title: "Role",
    image: "/team/Edward.png",
  },
  {
    name: "Kwabena Yeboah",
    title: "Product Designer",
    image: "/team/Kwabena.png",
  },
  {
    name: "Jean Afiba Garibah",
    title: "Secretary",
    image: "/team/Jean.png",
  },
  {
    name: "Mawutor Afoh",
    title: "Software Engineer",
    image: "/team/Mawutor.png",
  },
  {
    name: "Francis Donkor",
    title: "Product Designer",
    image: "/team/Francis.png",
  },
  {
    name: "Derrick Boateng",
    title: "Graphic Designer",
    image: "/team/Derrick.png",
  },
];

// Team Grid (dummy placeholder data) 

export const teamMembers = [
  {
    name: "Alex V.",
    role: "Chief Architect",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop",
  },
  {
    name: "Sarah L.",
    role: "Head of Engineering",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop",
  },
  {
    name: "Davide K.",
    role: "Product Design",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1000&auto=format&fit=crop",
  },
  {
    name: "Elena R.",
    role: "Grid Operations",
    image:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1000&auto=format&fit=crop",
  },
  {
    name: "Marcus J.",
    role: "Security Lead",
    image:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1000&auto=format&fit=crop",
  },
  {
    name: "Priya S.",
    role: "Frontend Engineer",
    image:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1000&auto=format&fit=crop",
  },
  {
    name: "Tom H.",
    role: "Backend Engineer",
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1000&auto=format&fit=crop",
  },
  {
    name: "Yuki M.",
    role: "Data Scientist",
    image:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1000&auto=format&fit=crop",
  },
];

// Impact Section 

export const impacts = [
  {
    title: "Better Planning, Less Waiting",
    description:
      "With predictable routes and timely arrivals, commuters can plan their day with confidence — reducing long waits, missed connections, and daily uncertainty.",
  },
  {
    title: "Cleaner Cities, Healthier Lives",
    description:
      "By running fully electric buses, Voltride cuts down fuel emissions and air pollution, helping create quieter streets and healthier urban environments.",
  },
  {
    title: "Stress-Free Commuting Experience",
    description:
      "Comfortable buses, clear trip information, and transparent payments remove the daily friction that makes public transport frustrating and exhausting.",
  },
];

// FAQ Section 
export const faqs = [
  {
    question: "How do I integrate Volteryde with my existing fleet?",
    answer:
      "Our platform supports standard OCPP 1.6/2.0 protocols. Simply point your chargers to our websocket endpoint `wss://api.volteryde.com/ocpp` and configure your API keys in the dashboard.",
  },
  {
    question: "What happens if the vehicle loses internet connection?",
    answer:
      "The Volteryde telemetry unit caches up to 48 hours of data locally. Once connectivity is restored, the data is batched and uploaded to the cloud without loss.",
  },
  {
    question: "Is V2G (Vehicle-to-Grid) supported on all EVs?",
    answer:
      "No, V2G requires bi-directional charging hardware and vehicle firmware support. Please check our Compatibility Matrix for a list of certified vehicles (Nissan Leaf, Ford F-150 Lightning, etc.).",
  },
  {
    question: "How is billing handled for public charging?",
    answer:
      "We aggregate charging sessions and invoice monthly. You can also set up automated credit card payments or connect your corporate fleet fuel card.",
  },
];
