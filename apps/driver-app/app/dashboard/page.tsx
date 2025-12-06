"use client";

import Image from "next/image";
import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import {
  PassengerCard,
  NotificationCard,
  DriverProfileModal,
  CancelRideModal,
  ReportPassengerModal,
  TripHistoryModal,
  AccountSettingsModal,
  GoOfflineModal,
  Map,
  type MapRef,
} from "../components";
import {
  mockDriver,
  mockRoute,
  pendingBoardingPassengers,
  alightingPassengers,
  notifications,
  passengersOnBoard
} from "../mockData/driverMock";

export default function DriverDashboard() {
  const [pendingBoardingExpanded, setPendingBoardingExpanded] = useState(false);
  const [alightingExpanded, setAlightingExpanded] = useState(false);
  const [passengersOnBoardExpanded, setPassengersOnBoardExpanded] =
    useState(false);
  const [notificationsExpanded, setNotificationsExpanded] = useState(false);
  const [isDriverProfileOpen, setIsDriverProfileOpen] = useState(false);
  const [isCancelRideOpen, setIsCancelRideOpen] = useState(false);
  const [isReportPassengerOpen, setIsReportPassengerOpen] = useState(false);
  const [isTripHistoryOpen, setIsTripHistoryOpen] = useState(false);
  const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState(false);
  const [selectedPassenger, setSelectedPassenger] = useState<string | null>(
    null
  );
  const [isOnline, setIsOnline] = useState(false);
  const [isGoOfflineModalOpen, setIsGoOfflineModalOpen] = useState(false);

  // Initial check (can be replaced with API call)
  useEffect(() => {
    // Start offline by default or check persistence
    setIsOnline(false);
  }, []);

  const handleToggleStatus = () => {
    if (isOnline) {
      // If currently online, ask for confirmation to go offline
      setIsGoOfflineModalOpen(true);
    } else {
      // If currently offline, go online immediately
      setIsOnline(true);
    }
  };

  const confirmGoOffline = () => {
    setIsOnline(false);
    setIsGoOfflineModalOpen(false);
  };

  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapRef>(null);

  // Resize map when sidebar width changes
  useEffect(() => {
    if (mapRef.current) {
      // Small timeout to allow the layout to update first (layout transition is 300ms/150ms usually, but we are resizing manually via JS so it's instant or rAF based)
      requestAnimationFrame(() => {
        mapRef.current?.resize();
      });
    }
  }, [sidebarWidth]);



  const handleAcceptRequest = (passengerId: string) => {
    console.log("Accept request for passenger:", passengerId);
  };

  const handleCancelRefund = (passengerId: string) => {
    setSelectedPassenger(passengerId);
    setIsCancelRideOpen(true);
  };

  const handleDropOff = (passengerId: string) => {
    console.log("Drop off passenger:", passengerId);
  };

  const handleIssueReport = (passengerId: string) => {
    console.log("Issue report for passenger:", passengerId);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = containerRect.width - e.clientX;

      // Constrain width between 200px and 800px
      const constrainedWidth = Math.max(200, Math.min(800, newWidth));

      setSidebarWidth(constrainedWidth);
    },
    [isResizing, setSidebarWidth]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="h-screen bg-white flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          {/* Left: Logo and route */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-brand-secondary flex items-center justify-center">
              <Image src="/volt.png" alt="Volt Logo" width={28} height={28} />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-gray-900 leading-tight">
                Voltride Driver
              </h1>
              <p className="text-xs text-gray-500 truncate">
                Route #42 - City Center Loop
              </p>
            </div>
          </div>

          {/* Center: Online status, toggle, status box */}
          <div className="flex-1 flex items-center justify-center gap-6">
            <div className="flex items-center gap-2 bg-white rounded-full px-4 py-1 border border-gray-200">
              <span className={`text-base font-semibold ${isOnline ? 'text-brand-secondary' : 'text-red-500'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
              <button
                onClick={handleToggleStatus}
                className="relative inline-flex items-center w-10 h-6 focus:outline-none"
              >
                <span className="absolute left-0 w-10 h-6 bg-gray-100 rounded-full"></span>
                <span className="absolute left-0 w-10 h-6 rounded-full border border-gray-200"></span>
                <span
                  className={`absolute left-0 w-6 h-6 rounded-full shadow transition-transform duration-200 ease-in-out ${isOnline ? 'bg-brand-secondary translate-x-4' : 'bg-red-500 translate-x-0'
                    }`}
                ></span>
              </button>
            </div>
            <div className={`${isOnline ? 'bg-green-200' : 'bg-red-100'} px-6 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200`}>
              {isOnline ? (
                <>
                  <svg
                    className="w-5 h-5 text-brand-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
                    />
                  </svg>
                  <span className="text-sm text-gray-900 font-medium">
                    You&apos;re online and ready to receive trip requests.
                  </span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                    />
                  </svg>
                  <span className="text-sm text-gray-900 font-medium">
                    You&apos;re Offline — Go online to start receiving requests.
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Right: Profile avatar and name */}
          <button
            onClick={() => setIsDriverProfileOpen(true)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-brand-secondary text-sm border border-gray-200">
              KM
            </div>
            <span className="text-base font-medium text-gray-900">
              Kwame Mensah
            </span>
          </button>
        </header>

        {/* Main Content */}
        {!isOnline ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-center p-8">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">You are currently offline</h2>
            <p className="text-gray-600 max-w-md mb-8">
              Go online to start receiving ride requests and manage your trips. You cannot see the map or passenger details while offline.
            </p>
            <button
              onClick={() => setIsOnline(true)}
              className="px-8 py-3 bg-brand-secondary text-white font-semibold rounded-lg shadow-lg hover:bg-green-600 transition-colors transform hover:scale-105"
            >
              Go Online
            </button>
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden" ref={containerRef}>
            {/* Map Section */}
            <div className="flex-1 relative bg-gray-100">
              <Map
                ref={mapRef}
                className="absolute inset-0 z-0"
                padding={{ top: 0, bottom: 200, left: 0, right: 0 }}
              />

              {/* Legend */}
              <div className="absolute left-6 bottom-36 bg-white/90 backdrop-blur-md rounded-xl shadow-lg p-4 w-56 z-10">
                <h3 className="font-bold text-gray-900 mb-3">Legend</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-5 h-5 text-gray-700"
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
                    <span className="text-sm text-gray-700">Starting Point</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-brand-secondary rounded flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                        <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-700">You</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center">
                      <div className="w-6 h-0.5 bg-blue-600"></div>
                    </div>
                    <span className="text-sm text-gray-700">Upcoming Route</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center">
                      <div className="w-6 h-0.5 bg-brand-secondary"></div>
                    </div>
                    <span className="text-sm text-gray-700">Completed Route</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-gray-800 rounded-full"></div>
                    <span className="text-sm text-gray-700">Stop</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Image src="/arrow.png" alt="Arrow Icon" width={20} height={20} className="w-5 h-5" />
                    <span className="text-sm text-gray-700">
                      Main Destination
                    </span>
                  </div>
                </div>
              </div>

              {/* Map Controls */}
              <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
                <button
                  onClick={() => mapRef.current?.zoomIn()}
                  className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => mapRef.current?.zoomOut()}
                  className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 12H4"
                    />
                  </svg>
                </button>
              </div>

              {/* Recenter Button */}
              <button className="absolute right-6 bottom-36 w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50">
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
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                </svg>
              </button>

              {/* Bottom Stats Bar */}
              <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 px-6 py-8 z-20">
                <div className="grid grid-cols-4 gap-6">
                  {/* Seats Occupied */}
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-6 h-6 text-gray-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <div>
                      <p className="text-xs text-gray-600">Seats Occupied</p>
                      <p className="text-xl font-bold text-gray-900">32 / 45</p>
                      <p className="text-xs text-brand-secondary">
                        13 Seat Available
                      </p>
                    </div>
                  </div>

                  {/* Battery Level */}
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-6 h-6 text-gray-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                      />
                    </svg>
                    <div>
                      <p className="text-xs text-gray-600">Battery Level</p>
                      <p className="text-xl font-bold text-gray-900">87%</p>
                      <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full bg-brand-secondary rounded-full"
                          style={{ width: "87%" }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Distance to Next Stop */}
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-6 h-6 text-gray-600"
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
                    <div>
                      <p className="text-xs text-gray-600">
                        Distance to Next Stop
                      </p>
                      <p className="text-xl font-bold text-gray-900">1.2km</p>
                      <p className="text-xs text-gray-600">Madina Bus Stop</p>
                    </div>
                  </div>

                  {/* Estimated Arrival Time */}
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-6 h-6 text-gray-600"
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
                    <div>
                      <p className="text-xs text-gray-600">
                        Estimated Arrival Time
                      </p>
                      <p className="text-xl font-bold text-gray-900">2 min</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Resize Handle */}
            <div className="flex items-center justify-center py-4">
              <div
                className="w-2 h-10 bg-gray-300 hover:bg-brand-secondary cursor-col-resize transition-colors rounded"
                onMouseDown={handleMouseDown}
              />
            </div>

            {/* Right Sidebar */}
            <div
              className="bg-white border-l border-gray-200 flex flex-col overflow-hidden"
              style={{ width: `${sidebarWidth}px` }}
              ref={sidebarRef}
            >
              {/* Passenger Activity Header */}
              <div className="px-6 py-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Passenger Activity
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Real-time passenger tracking
                </p>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto">
                {/* Pending Boarding */}
                <div className="px-6 pb-3">
                  <button
                    onClick={() =>
                      setPendingBoardingExpanded(!pendingBoardingExpanded)
                    }
                    className="w-full py-3 flex items-center justify-between hover:opacity-70 transition-opacity"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base font-normal text-brand-primary">
                        Pending Boarding
                      </span>
                      <span className="text-base font-medium bg-[#F5F5F5] rounded-full p-2 w-10 h-10 text-blue-600">
                        3
                      </span>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-900 transition-transform ${pendingBoardingExpanded ? "rotate-180" : ""
                        }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {!pendingBoardingExpanded && (
                    <div className="h-0.5 bg-brand-secondary mt-1"></div>
                  )}
                  {pendingBoardingExpanded && (
                    <div className="pt-4 space-y-4">
                      {pendingBoardingPassengers.map((passenger) => (
                        <PassengerCard
                          key={passenger.id}
                          name={passenger.name}
                          time={passenger.time}
                          from={passenger.from}
                          to={passenger.to}
                          status="boarding"
                          primaryAction={{
                            label: "Accept Request",
                            onClick: () => handleAcceptRequest(passenger.id),
                          }}
                          secondaryAction={{
                            label: "Cancel & Refund",
                            onClick: () => handleCancelRefund(passenger.id),
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Alighting */}
                <div className="px-6 pb-3">
                  <button
                    onClick={() => setAlightingExpanded(!alightingExpanded)}
                    className="w-full py-3 flex items-center justify-between hover:opacity-70 transition-opacity"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base font-normal text-gray-900">
                        Alighting
                      </span>
                      <span className="text-base font-normal text-blue-600">
                        2
                      </span>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-900 transition-transform ${alightingExpanded ? "rotate-180" : ""
                        }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {!alightingExpanded && (
                    <div className="h-0.5 bg-brand-secondary mt-1"></div>
                  )}
                  {alightingExpanded && (
                    <div className="pt-4 space-y-4">
                      {alightingPassengers.map((passenger) => (
                        <PassengerCard
                          key={passenger.id}
                          name={passenger.name}
                          time={passenger.time}
                          from={passenger.from}
                          to={passenger.to}
                          status="alighting"
                          primaryAction={{
                            label: "Drop off",
                            onClick: () => handleDropOff(passenger.id),
                          }}
                          secondaryAction={{
                            label: "Issue Report",
                            onClick: () => {
                              setSelectedPassenger(passenger.id);
                              setIsReportPassengerOpen(true);
                            },
                            hasIcon: true,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Passengers on board */}
                <div className="px-6 pb-3">
                  <button
                    onClick={() =>
                      setPassengersOnBoardExpanded(!passengersOnBoardExpanded)
                    }
                    className="w-full py-3 flex items-center justify-between hover:opacity-70 transition-opacity"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base font-normal text-gray-900">
                        Passengers on board
                      </span>
                      <span className="text-base font-normal text-gray-900">
                        32
                      </span>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-900 transition-transform ${passengersOnBoardExpanded ? "rotate-180" : ""
                        }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {!passengersOnBoardExpanded && (
                    <div className="h-0.5 bg-brand-secondary mt-1"></div>
                  )}
                  {passengersOnBoardExpanded && (
                    <div className="pt-4 space-y-4">
                      {passengersOnBoard.map((passenger) => (
                        <PassengerCard
                          key={passenger.id}
                          name={passenger.name}
                          time={passenger.time}
                          from={passenger.from}
                          to={passenger.to}
                          status="onboard"
                          primaryAction={{
                            label: "Call",
                            onClick: () => { },
                            hasIcon: true,
                          }}
                          secondaryAction={{
                            label: "Report",
                            onClick: () => {
                              setSelectedPassenger(passenger.id);
                              setIsReportPassengerOpen(true);
                            },
                            hasIcon: true,
                          }}
                          tertiaryAction={{
                            label: "Cancel Ride",
                            onClick: () => {
                              setSelectedPassenger(passenger.id);
                              setIsCancelRideOpen(true);
                            },
                            variant: "danger",
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Notification Section */}
                <div className="px-6 pb-3">
                  <button
                    onClick={() =>
                      setNotificationsExpanded(!notificationsExpanded)
                    }
                    className="w-full py-3 flex items-center justify-between hover:opacity-70 transition-opacity"
                  >
                    <div className="flex items-center gap-3">
                      <svg
                        className="w-5 h-5 text-gray-900"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        />
                      </svg>
                      <span className="text-base font-normal text-gray-900">
                        Notification
                      </span>
                      <span className="text-base font-normal text-red-500">
                        4 new
                      </span>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-900 transition-transform ${notificationsExpanded ? "rotate-180" : ""
                        }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {!notificationsExpanded && (
                    <div className="h-0.5 bg-brand-secondary mt-1"></div>
                  )}
                  {notificationsExpanded && (
                    <div className="pt-4 space-y-3">
                      {notifications.map((notification) => (
                        <NotificationCard
                          key={notification.id}
                          avatar={notification.avatar}
                          title={notification.title}
                          description={notification.description}
                          time={notification.time}
                          amount={notification.amount}
                          isUnread={notification.isUnread}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Driver Profile Modal */}
        <DriverProfileModal
          isOpen={isDriverProfileOpen}
          onClose={() => setIsDriverProfileOpen(false)}
          driver={mockDriver}
          route={mockRoute.name}
          onTripHistoryClick={() => setIsTripHistoryOpen(true)}
          onAccountSettingsClick={() => setIsAccountSettingsOpen(true)}
        />
        <CancelRideModal
          isOpen={isCancelRideOpen}
          onClose={() => setIsCancelRideOpen(false)}
          passengerName={
            selectedPassenger
              ? [
                ...pendingBoardingPassengers,
                ...alightingPassengers,
                ...passengersOnBoard,
              ].find((p) => p.id === selectedPassenger)?.name
              : undefined
          }
          pickupLocation={
            selectedPassenger
              ? [
                ...pendingBoardingPassengers,
                ...alightingPassengers,
                ...passengersOnBoard,
              ].find((p) => p.id === selectedPassenger)?.from
              : undefined
          }
          dropoffLocation={
            selectedPassenger
              ? [
                ...pendingBoardingPassengers,
                ...alightingPassengers,
                ...passengersOnBoard,
              ].find((p) => p.id === selectedPassenger)?.to
              : undefined
          }
        />
        <ReportPassengerModal
          isOpen={isReportPassengerOpen}
          onClose={() => setIsReportPassengerOpen(false)}
          passengerName={
            selectedPassenger
              ? [
                ...pendingBoardingPassengers,
                ...alightingPassengers,
                ...passengersOnBoard,
              ].find((p) => p.id === selectedPassenger)?.name
              : undefined
          }
          pickupLocation={
            selectedPassenger
              ? [
                ...pendingBoardingPassengers,
                ...alightingPassengers,
                ...passengersOnBoard,
              ].find((p) => p.id === selectedPassenger)?.from
              : undefined
          }
          dropoffLocation={
            selectedPassenger
              ? [
                ...pendingBoardingPassengers,
                ...alightingPassengers,
                ...passengersOnBoard,
              ].find((p) => p.id === selectedPassenger)?.to
              : undefined
          }
        />
        <TripHistoryModal
          isOpen={isTripHistoryOpen}
          onClose={() => setIsTripHistoryOpen(false)}
        />
        <AccountSettingsModal
          isOpen={isAccountSettingsOpen}
          onClose={() => setIsAccountSettingsOpen(false)}
        />
        <GoOfflineModal
          isOpen={isGoOfflineModalOpen}
          onClose={() => setIsGoOfflineModalOpen(false)}
          onConfirm={confirmGoOffline}
        />
      </div>
    </Suspense>
  );
}