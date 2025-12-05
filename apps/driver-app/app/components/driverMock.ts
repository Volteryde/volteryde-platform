export interface Driver {
  name: string;
  email: string;
  phone: string;
  rating: number;
  totalTrips: number;
  profileImageUrl: string;
}

export const mockDriver: Driver = {
  name: "Kwame Amponsah",
  email: "Kwame Amponsah@voltride.com",
  phone: "+233 24 123 4567",
  rating: 4.8,
  totalTrips: 1247,
  profileImageUrl:
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
};

export const mockRoute = "Route #42";
