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