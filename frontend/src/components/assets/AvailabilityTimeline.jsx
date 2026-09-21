import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

export const AvailabilityTimeline = ({ asset, rentals = [], daysCount = 14 }) => {
  const [startDateOffset, setStartDateOffset] = useState(0);

  // Generate days array starting from today + offset
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = [];
  for (let i = 0; i < daysCount; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + startDateOffset + i);
    days.push(d);
  }

  // Helper to check what booking covers a specific date
  const getBookingForDay = (date) => {
    const targetTime = date.getTime();
    const endOfDay = targetTime + 86400000 - 1;

    for (const rental of rentals) {
      if (['ACTIVE', 'OVERDUE', 'ISSUED'].includes(rental.status)) {
        const start = new Date(rental.issuedAt || rental.createdAt).getTime();
        const end = new Date(rental.dueDate).getTime();
        if (start <= endOfDay && end >= targetTime) {
          return { type: 'ACTIVE', rental };
        }
      } else if (['REQUESTED', 'APPROVED'].includes(rental.status)) {
        const start = new Date(rental.requestedStart || rental.createdAt).getTime();
        const end = new Date(rental.requestedEnd || rental.dueDate).getTime();
        if (start <= endOfDay && end >= targetTime) {
          return { type: 'RESERVED', rental };
        }
      }
    }

    if (asset?.status === 'MAINTENANCE') {
      return { type: 'MAINTENANCE' };
    }

    return null;
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-amber-600" />
          <h3 className="text-sm font-bold text-white">Live Booking & Availability Timeline</h3>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setStartDateOffset(prev => prev - 7)}
            className="p-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs transition-colors"
            title="Previous 7 days"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setStartDateOffset(0)}
            className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-[11px] text-stone-600 font-medium transition-colors"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setStartDateOffset(prev => prev + 7)}
            className="p-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs transition-colors"
            title="Next 7 days"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-[11px] text-stone-400">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/40" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-amber-100 border border-amber-500/40" />
          <span>Reserved / Requested</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-blue-100 border border-indigo-500/40" />
          <span>Active Checkout</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-rose-500/20 border border-red-300" />
          <span>Maintenance</span>
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="grid grid-cols-7 sm:grid-cols-14 gap-1.5 pt-2">
        {days.map((date, idx) => {
          const isToday = date.toDateString() === today.toDateString();
          const booking = getBookingForDay(date);

          let bg = 'bg-green-50 border-green-200 text-green-700 hover:bg-emerald-500/20';
          let label = 'Available';

          if (booking?.type === 'ACTIVE') {
            bg = 'bg-blue-100 border-indigo-500/40 text-blue-600 hover:bg-indigo-500/30';
            label = 'In Use';
          } else if (booking?.type === 'RESERVED') {
            bg = 'bg-amber-100 border-amber-500/40 text-amber-700 hover:bg-amber-500/30';
            label = 'Reserved';
          } else if (booking?.type === 'MAINTENANCE') {
            bg = 'bg-rose-500/20 border-red-300 text-red-600';
            label = 'Maintenance';
          }

          return (
            <div
              key={idx}
              className={`p-2 rounded-xl border text-center transition-all flex flex-col justify-between min-h-[70px] ${bg} ${
                isToday ? 'ring-2 ring-amber-400' : ''
              }`}
              title={`${date.toDateString()}: ${label}`}
            >
              <div>
                <p className="text-[10px] text-stone-400 font-medium">{dayNames[date.getDay()]}</p>
                <p className="text-xs font-bold text-stone-900 mt-0.5">{date.getDate()}</p>
                <p className="text-[9px] text-stone-400">{monthNames[date.getMonth()]}</p>
              </div>

              <div className="mt-1">
                <span className="text-[9px] font-semibold block truncate">
                  {label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
