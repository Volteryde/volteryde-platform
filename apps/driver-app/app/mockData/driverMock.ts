export const mockDriver = {
  name: "Kwame Mensah",
  email: "kwame.mensah@volteryde.com",
  phone: "+233 24 123 4567",
  rating: 4.8,
  totalTrips: 1247,
  profileImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
  id: "1",
  joinDate: "2023-01-15",
  vehicle: {
    make: "Tesla",
    model: "Model 3",
    year: 2023,
    licensePlate: "GT 1234-23",
    color: "Pearl White"
  },
  stats: {
    todayEarnings: 127.50,
    weeklyEarnings: 892.30,
    monthlyEarnings: 3456.80,
    totalEarnings: 45678.90,
    rating: 4.8,
    totalRides: 1247,
    acceptanceRate: 94.2,
    completionRate: 98.1
  }
};

export const mockRoute = {
  id: "route-42",
  name: "City Center Loop",
  stops: [
    "University of Ghana, Stadium Bus Stop",
    "Accra Mall",
    "Madina Bus Stop",
    "Adenta Bus Stop",
    "Tech Junction"
  ],
  totalDistance: 45.2,
  estimatedDuration: 85,
  currentStop: 2,
  nextStop: "Madina Bus Stop"
};

export const pendingBoardingPassengers = [
  {
    id: "1",
    name: "Kwabena Osei",
    time: "8 min",
    from: "University of Ghana, Stadium Bus Stop",
    to: "Accra Mall",
  },
  {
    id: "2",
    name: "Kwabena Osei",
    time: "8 min",
    from: "University of Ghana, Stadium Bus Stop",
    to: "Accra Mall",
  },
  {
    id: "3",
    name: "Kwabena Osei",
    time: "8 min",
    from: "University of Ghana, Stadium Bus Stop",
    to: "Accra Mall",
  },
];

export const alightingPassengers = [
  {
    id: "1",
    name: "Nana Kofi",
    time: "8 min",
    from: "University of Ghana, Stadium Bus Stop",
    to: "Accra Mall",
  },
  {
    id: "2",
    name: "Kwabena Osei",
    time: "8 min",
    from: "University of Ghana, Stadium Bus Stop",
    to: "Accra Mall",
  },
  {
    id: "3",
    name: "Kwabena Osei",
    time: "8 min",
    from: "University of Ghana, Stadium Bus Stop",
    to: "Accra Mall",
  },
];

export const notifications = [
  {
    id: "1",
    avatar: "AD",
    title: "Passenger Boarded",
    description:
      "Akosua Darko has successfully boarded the bus at University of Ghana, Stadium Bus Stop.",
    time: "7m ago",
    isUnread: true,
  },
  {
    id: "2",
    avatar: "KM",
    title: "Upcoming Drop-off",
    description:
      "Approaching drop-off point for Kwame Mensah at Adenta Bus Stop.",
    time: "7m ago",
    isUnread: true,
  },
  {
    id: "3",
    avatar: "KB",
    title: "Trip Cancelled",
    description: "Kofi Boateng cancelled their trip to Tech Junction.",
    time: "7m ago",
    amount: "₵ 12.00",
    isUnread: true,
  },
  {
    id: "4",
    avatar: "AD",
    title: "Passenger Boarded",
    description:
      "Akosua Darko has successfully boarded the bus at University of Ghana, Stadium Bus Stop.",
    time: "7m ago",
    isUnread: false,
  },
];

export const passengersOnBoard = [
  {
    id: "1",
    name: "Kwabena Osei",
    time: "8 min",
    from: "University of Ghana, Stadium Bus Stop",
    to: "Accra Mall",
    status: "onboard",
  },
  {
    id: "2",
    name: "Kwabena Osei",
    time: "8 min",
    from: "University of Ghana, Stadium Bus Stop",
    to: "Accra Mall",
    status: "onboard",
  },
  {
    id: "3",
    name: "Kwabena Osei",
    time: "8 min",
    from: "University of Ghana, Stadium Bus Stop",
    to: "Accra Mall",
    status: "onboard",
  },
];