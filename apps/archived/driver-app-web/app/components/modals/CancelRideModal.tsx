"use client";

import { useState } from "react";
import Image from "next/image";

interface CancelRideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: (reason: string, comment?: string) => void;
  rideId?: string;
  passengerName?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  originalFare?: number;
  distanceTraveled?: number;
}

interface CancellationReason {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const cancellationReasons: CancellationReason[] = [
  {
    id: "early-exit",
    title: "Passenger Requested Early Exit",
    description: "Passenger wants to get off before scheduled stop",
    icon: (
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
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
  },
  {
    id: "emergency",
    title: "Emergency Situation",
    description: "Medical or personal emergency requiring immediate exit",
    icon: (
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
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
  },
  {
    id: "wrong-route",
    title: "Wrong Route/Destination",
    description: "Passenger boarded wrong bus or route",
    icon: (
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
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
  {
    id: "behavior",
    title: "Behavior Issue",
    description: "Passenger behavior requires removal from bus",
    icon: (
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
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
];

export default function CancelRideModal({
  isOpen,
  onClose,
  onConfirm,
  passengerName = "Yaw Mensah",
  pickupLocation = "Kwame Nkrumah Circle",
  dropoffLocation = "Legon Campus",
  originalFare = 15.5,
  distanceTraveled = 3.2,
}: CancelRideModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [comment, setComment] = useState<string>("");
  const [showCommentInput, setShowCommentInput] = useState(false);

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm(selectedReason, comment);
    }
    handleClose();
  };

  const handleClose = () => {
    setSelectedReason("");
    setComment("");
    setShowCommentInput(false);
    onClose();
  };

  const commitmentFee = 1.5;
  const chargedFare = 2.0;
  const refundAmount = originalFare - chargedFare - commitmentFee;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 animate-in fade-in duration-200"
        style={{ backgroundColor: "#00000080" }}
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl rounded-3xl bg-background shadow-2xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        {/* Red Header */}
        <div className="bg-red-500 px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full border-3 border-white flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white">Cancel Ride</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:bg-white/10 rounded-full p-1 transition-colors"
            aria-label="Close modal"
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

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="p-6 space-y-6">
            {/* Passenger Info */}
            <div className="bg-[#F5F5F5] rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-semibold">
                YM
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-brand-primary text-lg mb-1">
                  {passengerName}
                </h3>
                <div className="flex items-center gap-2 text-sm text-foreground/70">
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
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                  </svg>
                  <span>
                    {pickupLocation} → {dropoffLocation}
                  </span>
                </div>
              </div>
            </div>

            {/* Select Cancellation Reason */}
            <div>
              <h3 className="font-semibold text-brand-primary text-lg mb-1">
                Select Cancellation Reason{" "}
                <span className="text-red-500">*</span>
              </h3>

              <div className="grid grid-cols-2 gap-3 mt-4">
                {cancellationReasons.map((reason) => (
                  <button
                    key={reason.id}
                    onClick={() => setSelectedReason(reason.id)}
                    className={`p-4 rounded-lg text-left transition-all ${
                      selectedReason === reason.id
                        ? "border border-brand-primary bg-brand-primary/5"
                        : "shadow-xs bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`shrink-0 bg-[#F5F5F5] p-2 rounded-xl ${
                          selectedReason === reason.id
                            ? "text-brand-primary"
                            : "text-gray-400"
                        }`}
                      >
                        {reason.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-brand-primary mb-1">
                          {reason.title}
                        </h4>
                        <p className="text-xs text-foreground/60 leading-relaxed">
                          {reason.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Leave a Comment */}
            <div>
              <button
                onClick={() => setShowCommentInput(!showCommentInput)}
                className="w-full px-6 py-3 border border-brand-primary rounded-full hover:bg-foreground/5 transition-colors flex items-center justify-center gap-2"
              >
                <Image src="/pen.png" alt="Pen Icon" width={20} height={20} />
                <span className="font-medium text-brand-primary">
                  Leave a Comment
                </span>
              </button>

              {showCommentInput && (
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add any additional details..."
                  className="w-full mt-3 px-4 py-3 border border-foreground/20 rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
                  rows={3}
                />
              )}
            </div>

            {/* Refund Calculation */}
            <div className="border-2 border-[#737373] bg-[#F5F5F5] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4 text-brand-primary">
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
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
                <h3 className="font-semibold text-lg text-brand-primary">
                  Refund Calculation
                </h3>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground/70">Original Fare</span>
                  <span className="font-medium">
                    GH₵{originalFare.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground/70">
                    Distance Traveled ({distanceTraveled} km)
                  </span>
                  <span className="font-medium text-red-500">
                    - GH₵{chargedFare.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground/70">10% Commitment fee</span>
                  <span className="font-medium text-red-500">
                    - GH₵{commitmentFee.toFixed(2)}
                  </span>
                </div>
                <div className="pt-3 border-t border-foreground/20 flex justify-between">
                  <span className="font-semibold text-red-500">
                    Refund Amount
                  </span>
                  <span className="font-bold text-red-500">
                    GH₵{refundAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2 justify-end">
              <div>
                <button
                  onClick={handleClose}
                  className="flex-1 px-12 py-3 text-base font-medium border-2 border-brand-primary text-brand-primary rounded-full hover:bg-foreground/5 transition-colors"
                >
                  Cancel
                </button>
              </div>
              <div>
                <button
                  onClick={handleConfirm}
                  disabled={!selectedReason}
                  className="flex-1 px-12 py-3 text-base font-medium bg-red-500 text-white rounded-full hover:bg-red-600 transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
