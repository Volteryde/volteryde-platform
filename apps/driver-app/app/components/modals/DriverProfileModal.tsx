"use client";

import Image from "next/image";
import { Driver } from "../driverMock";

interface DriverProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver: Driver;
  route: string;
  onTripHistoryClick?: () => void;
  onAccountSettingsClick?: () => void;
}

export default function DriverProfileModal({
  isOpen,
  onClose,
  driver,
  route,
  onTripHistoryClick,
  onAccountSettingsClick,
}: DriverProfileModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 animate-in fade-in duration-200"
        style={{ backgroundColor: "#00000080" }}
        onClick={onClose}
      />

      {/* Modal - positioned at top right */}
      <div className="absolute top-16 right-6 w-full max-w-sm rounded-2xl bg-white shadow-2xl max-h-[calc(100vh-5rem)] overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
        {/* Green Header */}
        <div className="bg-brand-secondary px-6 py-6">
          <div className="flex items-center gap-4">
            {/* Profile Photo */}
            <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg shrink-0">
              <Image
                src={driver.profileImageUrl}
                alt={driver.name}
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Name and Route Info */}
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-white mb-2">
                {driver.name}
              </h2>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                  {route}
                </span>
                <div className="flex items-center gap-1 text-white">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-sm text-white">{driver.rating}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)] px-6 py-6">
          {/* Contact Information */}
          <div className="space-y-4 mb-6">
            {/* Email */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#F5F5F5] text-brand-primary flex items-center justify-center shrink-0">
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
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs text-foreground/50 mb-1">Email</p>
                <p className="text-base font-medium text-brand-primary">
                  {driver.email}
                </p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#F5F5F5] text-brand-primary flex items-center justify-center shrink-0">
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
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs text-foreground/50 mb-1">Phone</p>
                <p className="text-base font-medium text-brand-primary">
                  {driver.phone}
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-4 bg-white shadow-xs rounded-xl">
              <div className="text-3xl font-bold text-brand-secondary mb-1">
                {driver.totalTrips}
              </div>
              <p className="text-sm text-foreground/60">Total Trips</p>
            </div>
            <div className="text-center p-4 bg-white shadow-xs rounded-xl">
              <div className="text-3xl font-bold text-brand-secondary mb-1">
                {driver.rating}
              </div>
              <p className="text-sm text-foreground/60">Ratings</p>
            </div>
          </div>

          {/* Menu Items */}
          <div className="space-y-2">
            {/* Trip History */}
            <button
              onClick={() => {
                onClose();
                onTripHistoryClick?.();
              }}
              className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-brand-primary/50"
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
                <span className="font-medium text-brand-primary">
                  Trip History
                </span>
              </div>
              <svg
                className="w-4 h-4 text-brand-primary/50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>

            {/* Account Settings */}
            <button
              onClick={() => {
                onClose();
                onAccountSettingsClick?.();
              }}
              className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-brand-primary/50"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="font-medium text-foreground">
                  Account Settings
                </span>
              </div>
              <svg
                className="w-4 h-4 text-brand-primary/50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>

            {/* Logout */}
            <button className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-red-100 transition-colors">
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
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span className="font-medium text-red-500">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
