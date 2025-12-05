"use client";

import Image from "next/image";
import Modal from "./Modal";

interface Driver {
  id: string;
  name: string;
  photo?: string;
  rating: number;
  totalRides: number;
  phone: string;
  vehicle: {
    make: string;
    model: string;
    color: string;
    plate: string;
  };
  eta?: string;
  location?: string;
}

interface DriverDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver?: Driver;
}

export default function DriverDetailsModal({
  isOpen,
  onClose,
  driver,
}: DriverDetailsModalProps) {
  // Mock data for demonstration
  const mockDriver: Driver = driver || {
    id: "1",
    name: "John Smith",
    rating: 4.8,
    totalRides: 1247,
    phone: "+1 (555) 123-4567",
    vehicle: {
      make: "Toyota",
      model: "Camry",
      color: "Silver",
      plate: "ABC 1234",
    },
    eta: "3 minutes",
    location: "0.5 miles away",
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-6 -mt-2">
        {/* Driver Profile */}
        <div className="flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-brand-primary/10 flex items-center justify-center mb-4">
            {mockDriver.photo ? (
              <Image
                src={mockDriver.photo}
                alt={mockDriver.name}
                width={96}
                height={96}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <svg
                className="w-12 h-12 text-brand-primary"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          <h3 className="text-xl font-semibold mb-1">{mockDriver.name}</h3>
          <div className="flex items-center gap-1 text-sm text-foreground/70">
            <svg
              className="w-4 h-4 text-yellow-500 fill-current"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="font-medium text-black">{mockDriver.rating}</span>
            <span>({mockDriver.totalRides} rides)</span>
          </div>
        </div>

        {/* ETA Info */}
        {mockDriver.eta && (
          <div className="bg-brand-secondary/10 border border-brand-secondary/20 rounded-lg p-4 text-center">
            <p className="text-sm text-foreground/70 mb-1">Arriving in</p>
            <p className="text-2xl font-bold text-brand-secondary">
              {mockDriver.eta}
            </p>
            {mockDriver.location && (
              <p className="text-sm text-foreground/60 mt-1">
                {mockDriver.location}
              </p>
            )}
          </div>
        )}

        {/* Vehicle Details */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-foreground/70 uppercase">
            Vehicle Information
          </h4>
          <div className="bg-foreground/5 rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-foreground/60">Make & Model</span>
              <span className="text-sm font-medium">
                {mockDriver.vehicle.make} {mockDriver.vehicle.model}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-foreground/60">Color</span>
              <span className="text-sm font-medium">
                {mockDriver.vehicle.color}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-foreground/60">License Plate</span>
              <span className="text-sm font-medium font-mono bg-background px-2 py-1 rounded">
                {mockDriver.vehicle.plate}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-foreground/10 rounded-lg hover:border-brand-primary hover:bg-brand-primary/5 transition-all">
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
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            <span className="font-medium">Call</span>
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-foreground/10 rounded-lg hover:border-brand-primary hover:bg-brand-primary/5 transition-all">
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
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span className="font-medium">Message</span>
          </button>
        </div>

        {/* Share Trip */}
        <button className="w-full py-3 text-sm font-medium text-brand-primary border-2 border-brand-primary rounded-lg hover:bg-brand-primary hover:text-white transition-all">
          Share Trip Details
        </button>
      </div>
    </Modal>
  );
}
