"use client";

interface NotificationCardProps {
  avatar: string;
  title: string;
  description: string;
  time: string;
  amount?: string;
  isUnread?: boolean;
}

export function NotificationCard({
  avatar,
  title,
  description,
  time,
  amount,
  isUnread = true,
}: NotificationCardProps) {
  return (
    <div
      className={`p-4 transition-colors mb-4 rounded-[10px] ${
        isUnread ? "bg-[#F5F5F5]" : "bg-white"
      }`}
    >
      <div className="flex gap-3.5">
        {/* Avatar */}
        <div className="shrink-0">
          <div className="w-12 h-12 rounded-full bg-[#CCCCCC] flex items-center justify-center">
            <span className="text-lg font-semibold text-[#737373]">
              {avatar}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-brand-primary text-lg">
              {title}
            </h4>
            {isUnread && (
              <div className="shrink-0 w-2.5 h-2.5 rounded-full bg-brand-secondary mt-1" />
            )}
          </div>
          <p className="text-base text-[#737373] mt-1 leading-relaxed">
            {description}
          </p>
          <div className="flex flex-col gap-3 mt-2">
            {amount && (
              <div className="inline-block py-1 px-2 text-brand-primary w-20 bg-white border border-[#BFBFBF] rounded-lg font-medium">
                {amount}
              </div>
            )}
            <div className="flex items-center gap-1 text-xs text-foreground/50">
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-base">{time}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
