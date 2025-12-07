"use client";

import { useState } from "react";
import Image from "next/image";

interface TripHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FilterTab = "all" | "completed" | "cancelled";

interface Trip {
  id: string;
  passengerName: string;
  date: string;
  time: string;
  from: string;
  to: string;
  status: "completed" | "cancelled";
}

export default function TripHistoryModal({
  isOpen,
  onClose,
}: TripHistoryModalProps) {
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  // Sample trip data
  const allTrips: Trip[] = [
    {
      id: "1",
      passengerName: "Akosua Darko",
      date: "October 14, 2025",
      time: "09:00 AM",
      from: "University of Ghana, Stadium Bus Stop",
      to: "Accra Mall",
      status: "completed",
    },
    {
      id: "2",
      passengerName: "William Asamoah",
      date: "October 14, 2025",
      time: "09:00 AM",
      from: "University of Ghana, Stadium Bus Stop",
      to: "Accra Mall",
      status: "completed",
    },
    {
      id: "3",
      passengerName: "Nana Adjei",
      date: "October 14, 2025",
      time: "09:00 AM",
      from: "University of Ghana, Stadium Bus Stop",
      to: "Accra Mall",
      status: "completed",
    },
    {
      id: "4",
      passengerName: "William Asamoah",
      date: "October 14, 2025",
      time: "09:00 AM",
      from: "University of Ghana, Stadium Bus Stop",
      to: "Accra Mall",
      status: "cancelled",
    },
    {
      id: "5",
      passengerName: "Lilian Quartey",
      date: "October 14, 2025",
      time: "09:00 AM",
      from: "University of Ghana, Stadium Bus Stop",
      to: "Accra Mall",
      status: "completed",
    },
    {
      id: "6",
      passengerName: "Mark Owusu",
      date: "October 14, 2025",
      time: "09:00 AM",
      from: "University of Ghana, Stadium Bus Stop",
      to: "Accra Mall",
      status: "completed",
    },
    {
      id: "7",
      passengerName: "Janet Gan",
      date: "October 14, 2025",
      time: "09:00 AM",
      from: "University of Ghana, Stadium Bus Stop",
      to: "Accra Mall",
      status: "completed",
    },
  ];

  // Filter trips based on active tab
  const filteredTrips = allTrips.filter((trip) => {
    if (activeFilter === "completed") return trip.status === "completed";
    if (activeFilter === "cancelled") return trip.status === "cancelled";
    return true;
  });

  // Further filter by search query
  const searchedTrips = filteredTrips.filter(
    (trip) =>
      trip.passengerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.to.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Count trips by status
  const completedCount = allTrips.filter(
    (t) => t.status === "completed"
  ).length;
  const cancelledCount = allTrips.filter(
    (t) => t.status === "cancelled"
  ).length;

  // Group trips by date section (Today, Yesterday)
  const todayTrips = searchedTrips.filter(
    (trip) => trip.date === "October 14, 2025"
  );
  const yesterdayTrips = searchedTrips.filter(
    (trip) => trip.date === "October 13, 2025"
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 animate-in fade-in duration-200"
        style={{ backgroundColor: "#00000080" }}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl animate-in zoom-in-95 fade-in duration-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Green Header */}
        <div className="bg-brand-secondary px-6 py-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <svg
              className="w-7 h-7 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <h2 className="text-2xl font-bold text-white">Trip History</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="px-6 pt-6 pb-4 flex-shrink-0">
          <div className="flex gap-2 bg-gray-100 rounded-full p-3">
            <button
              onClick={() => setActiveFilter("all")}
              className={`flex-1 py-3 px-4 rounded-full text-lg font-medium transition-all ${
                activeFilter === "all"
                  ? "bg-white text-brand-primary shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All ({allTrips.length})
            </button>
            <button
              onClick={() => setActiveFilter("completed")}
              className={`flex-1 py-3 px-4 rounded-full text-lg font-medium transition-all ${
                activeFilter === "completed"
                  ? "bg-white text-brand-primary shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Completed ({completedCount})
            </button>
            <button
              onClick={() => setActiveFilter("cancelled")}
              className={`flex-1 py-3 px-4 rounded-full text-lg font-medium transition-all ${
                activeFilter === "cancelled"
                  ? "bg-white text-brand-primary shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Cancelled ({cancelledCount})
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-6 pb-4 mt-4 shrink-0">
          <div className="relative">
            <svg
              className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by passenger name, location, or trip ID..."
              className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-secondary/50 text-gray-900 placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* Trip List - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 mt-6">
          {/* Today Section */}
          {activeFilter === "all" && todayTrips.length > 0 && (
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-brand-primary mb-4">Today</h3>
              <div className="space-y-4">
                {todayTrips.map((trip) => (
                  <TripCard key={trip.id} trip={trip} />
                ))}
              </div>
            </div>
          )}

          {activeFilter === "cancelled" && (
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-brand-primary mb-4">
                Today (1)
              </h3>
              <div className="space-y-4">
                {searchedTrips
                  .filter((t) => t.status === "cancelled")
                  .slice(0, 1)
                  .map((trip) => (
                    <TripCard key={trip.id} trip={trip} />
                  ))}
              </div>
            </div>
          )}

          {/* Yesterday Section */}
          {activeFilter === "completed" && (
            <div>
              <h3 className="text-2xl font-bold text-brand-primary mb-4">
                Yesterday
              </h3>
              <div className="space-y-4">
                {searchedTrips.slice(0, 2).map((trip) => (
                  <TripCard key={trip.id} trip={trip} />
                ))}
              </div>
            </div>
          )}

          {activeFilter === "all" && (
            <div>
              <h3 className="text-2xl font-bold text-brand-primary mb-4" >Today</h3>
              <div className="space-y-4">
                {searchedTrips.slice(0, 3).map((trip) => (
                  <TripCard key={trip.id} trip={trip} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Trip Card Component
function TripCard({ trip }: { trip: Trip }) {
  return (
    <div className="bg-[#FCFCFC] border border-[#F5F5F5] rounded-3xl p-4">
      {/* Passenger Info */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-[#F5F5F5] flex items-center justify-center">
            <Image
              src="/person.png"
              alt="Passenger Avatar"
              width={24}
              height={24}
              className="shrink-0"
            />
          </div>
          <div>
            <h4 className="font-semibold text-brand-primary text-lg">
              {trip.passengerName}
            </h4>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>{trip.date}</span>
              </div>
              <div className="flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{trip.time}</span>
              </div>
            </div>
          </div>
        </div>
        <span
          className={`px-3 py-1 mb-4 rounded-full text-sm font-medium ${
            trip.status === "completed"
              ? "bg-brand-secondary/10 text-brand-secondary"
              : "bg-red-50 text-red-500"
          }`}
        >
          {trip.status === "completed" ? "Completed" : "Cancelled"}
        </span>
      </div>

      {/* Route Info */}
      <div className="space-y-3 ml-1">
        <div className="flex items-start gap-2 text-base text-gray-700">
          <svg
            className="w-4.5 h-4.5 text-brand-primary mt-0.5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span>
            <span className="font-medium">From:</span> {trip.from}
          </span>
        </div>
        <div className="flex items-start gap-2 text-base text-gray-700">
          <Image 
            src="/arrow.png"
            alt="Arrow Icon"
            width={18}
            height={18}
            className="shrink-0"
          />
          <span>
            <span className="font-medium">To:</span> {trip.to}
          </span>
        </div>
      </div>
    </div>
  );
}
