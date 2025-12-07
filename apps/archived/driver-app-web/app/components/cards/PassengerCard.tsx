"use client";

import Image from "next/image";

interface PassengerCardProps {
  name: string;
  time: string;
  from: string;
  to: string;
  status: "boarding" | "alighting" | "onboard";
  primaryAction: {
    label: string;
    onClick: () => void;
    hasIcon?: boolean;
    icon?: React.ReactNode;
  };
  secondaryAction: {
    label: string;
    onClick: () => void;
    hasIcon?: boolean;
  };
  tertiaryAction?: {
    label: string;
    onClick: () => void;
    variant?: "danger";
  };
}

export function PassengerCard({
  name,
  time,
  from,
  to,
  status,
  primaryAction,
  secondaryAction,
  tertiaryAction,
}: PassengerCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#F5F5F5] p-4  space-y-4">
      <div className="flex items-start gap-3">
        {status === "boarding" ? (
          <div className="p-2 bg-[#F5F5F5] rounded-xl">
            <Image
              src="/people.png"
              alt="People"
              width={24}
              height={24}
              className="shrink-0"
            />
          </div>
        ) : (
          <Image
            src="/person.png"
            alt="Person"
            width={24}
            height={24}
            className="shrink-0"
          />
        )}
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <h4 className="text-base font-semibold text-gray-900">{name}</h4>
              <p className="text-xs text-gray-500">{time}</p>
            </div>
            <span
              className={`text-xs px-3 py-1  bg-[#F5F5F5] rounded-full ${
                status === "boarding"
                  ? " text-blue-600"
                  : status === "onboard"
                  ? "text-green-600"
                  : " text-red-600"
              }`}
            >
              {status === "boarding"
                ? "Boarding"
                : status === "onboard"
                ? "On board"
                : "Alighting"}
            </span>
          </div>
        </div>
      </div>
      <div className="ml-1.5 mt-2.5">
        <div className="space-y-4 mb-3">
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <svg
              className="w-4 h-4 shrink-0 mt-0.5 text-brand-primary"
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
            <span>From: {from}</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <Image src="/arrow.png" alt="Arrow" width={16} height={16} />
            <span>To: {to}</span>
          </div>
        </div>
      </div>
      <div className="ml-1.5 mt-3">
        <div className="flex gap-2">
          <button
            onClick={primaryAction.onClick}
            className={`${tertiaryAction ? "w-[105px]" : "flex-1"} ${
              status === "onboard"
                ? "bg-white py-2 px-4 rounded-full text-brand-primary font-medium border border-brand-primary hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
                : "bg-brand-secondary text-white text-base py-2 px-4 rounded-full font-medium hover:bg-brand-secondary/90 transition-colors"
            }`}
          >
            {primaryAction.label}
            {primaryAction.label.toLowerCase().includes("call") && (
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
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
            )}
            {primaryAction.hasIcon && primaryAction.icon}
          </button>
          <button
            onClick={secondaryAction.onClick}
            className={`${
              tertiaryAction ? "w-[105px]" : "flex-1"
            } bg-white py-2 px-4 rounded-full text-brand-primary font-medium border border-brand-primary hover:bg-gray-50 transition-colors flex items-center justify-center gap-1`}
          >
            {secondaryAction.label}
            {secondaryAction.hasIcon && (
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
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
          </button>
          {tertiaryAction && (
            <button
              onClick={tertiaryAction.onClick}
              className={`flex-1 py-2 px-8 bg-[#F02C2C] rounded-full text-base font-medium transition-colors ${
                tertiaryAction.variant === "danger"
                  ? "bg-[#F02C2C] text-white hover:bg-[#F02C2C]/90"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {tertiaryAction.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
