"use client";

import { useState } from "react";
import Image from "next/image";

interface ReportPassengerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (category: string, comment: string) => void;
  passengerName?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
}

export default function ReportPassengerModal({
  isOpen,
  onClose,
  onSubmit,
  passengerName = "Yaw Mensah",
  pickupLocation = "Kwame Nkrumah Circle",
  dropoffLocation = "Legon Campus",
}: ReportPassengerModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (selectedCategory) {
      onSubmit?.(selectedCategory, comment);
      // Reset state
      setSelectedCategory("");
      setShowComment(false);
      setComment("");
      onClose();
    }
  };

  const handleCancel = () => {
    // Reset state
    setSelectedCategory("");
    setShowComment(false);
    setComment("");
    onClose();
  };

  const categories = [
    {
      id: "inappropriate",
      title: "Inappropriate Behavior",
      description: "Rude, aggressive, or disruptive conduct",
    },
    {
      id: "safety",
      title: "Safety Concern",
      description: "behaviour that threaten safety of driver or passengers",
    },
    {
      id: "property",
      title: "Property Damage",
      description: "Damage to vechicle or property",
    },
    {
      id: "no-show",
      title: "Repeated No-Shows",
      description: "Passenger frequently doesn't show up",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#000000]/80 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 bg-white rounded-3xl shadow-2xl animate-in zoom-in-95 fade-in duration-200 overflow-hidden">
        {/* Red Header */}
        <div className="bg-red-500 px-6 py-5 flex items-center justify-between">
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h2 className="text-2xl font-bold text-white">Report Passenger</h2>
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

        {/* Content */}
        <div className="p-6 space-y-12">
          {/* Passenger Info Card */}
          <div className="flex items-center gap-4 bg-[#F5F5F5] rounded-xl p-4 pb-6">
            <div className="w-12 h-12 rounded-full bg-[#CCCCCC] text-[#737373] flex items-center justify-center font-semibold text-lg">
              {passengerName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </div>
            <div>
              <h3 className="font-semibold text-lg text-brand-primary mb-1">
                {passengerName}
              </h3>
              <div className="flex items-center gap-1 text-gray-600 text-sm">
                <svg
                  className="w-4 h-4 text-brand-primary"
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
                  {pickupLocation} → {dropoffLocation}
                </span>
              </div>
            </div>
          </div>

          {/* Select Issue Category */}
          <div>
            <label className="block text-gray-900 font-semibold mb-4">
              Select Issue Category <span className="text-red-500">*</span>
            </label>

            {/* 2x2 Grid */}
            <div className="grid grid-cols-2 gap-4">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-start gap-3 p-4 rounded-xl transition-all text-left ${
                    selectedCategory === category.id
                      ? "border border-brand-primary bg-brand-primary/5"
                      : "bg-white"
                  }`}
                >
                  <svg
                    className={`w-6 h-6 mt-0.5 hrink-0 ${
                      selectedCategory === category.id
                        ? "text-red-500"
                        : "text-[#F5F5F5]"
                    }`}
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
                  <div>
                    <h4 className="font-semibold text-brand-primary mb-1">
                      {category.title}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {category.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Leave a Comment Button */}
          {!showComment ? (
            <button
              onClick={() => setShowComment(true)}
              className="w-full py-3 px-6 rounded-full border border-brand-primary text-gray-900 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <Image src="/pen.png" alt="Pen Icon" width={20} height={20} />
              Leave a Comment
            </button>
          ) : (
            <div className="space-y-2">
              <label className="block text-gray-900 font-semibold">
                Additional Comments
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Provide additional details about the incident..."
                rows={4}
                className="w-full px-6 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 resize-none"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-12 justify-end">
            <div>
              <button
                onClick={handleCancel}
                className="flex-1 py-3 px-16 rounded-full border-2 border-gray-300 text-gray-900 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
            <div>
              <button
                onClick={handleSubmit}
                disabled={!selectedCategory}
                className={`flex-1 py-3 px-6 rounded-full font-medium transition-colors flex items-center justify-center gap-2 ${
                  selectedCategory
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-gray-300 text-white cursor-not-allowed"
                }`}
              >
                <Image
                  src="/upload.png"
                  alt="Upload Icon"
                  width={20}
                  height={20}
                />
                Submit Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
