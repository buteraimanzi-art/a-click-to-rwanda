import { useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { format, isSameDay, isPast, isToday, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

interface ItineraryDay {
  id: string;
  date: string;
  day_type: string;
  destination_id: string;
  activity_id: string | null;
  hotel_id: string | null;
  wake_time?: string;
  breakfast_time?: string;
  lunch_time?: string;
  dinner_time?: string;
}

interface ItineraryCalendarViewProps {
  itinerary: ItineraryDay[];
  destinations: Array<{ id: string; name: string }> | undefined;
  activities: Array<{ id: string; name: string }> | undefined;
  onDayClick?: (date: Date) => void;
}

export const ItineraryCalendarView = ({
  itinerary,
  destinations,
  activities,
  onDayClick,
}: ItineraryCalendarViewProps) => {
  // Get all itinerary dates
  const itineraryDates = useMemo(() => {
    return itinerary.map((item) => new Date(item.date));
  }, [itinerary]);

  // Find itinerary item for a specific date
  const getItineraryForDate = (date: Date) => {
    return itinerary.find((item) => isSameDay(new Date(item.date), date));
  };

  // Custom day renderer
  const modifiers = useMemo(() => {
    const today = startOfDay(new Date());
    
    return {
      itineraryDay: itineraryDates,
      pastItinerary: itineraryDates.filter((date) => isPast(date) && !isToday(date)),
      todayItinerary: itineraryDates.filter((date) => isToday(date)),
      futureItinerary: itineraryDates.filter((date) => !isPast(date) && !isToday(date)),
    };
  }, [itineraryDates]);

  const modifiersClassNames = {
    pastItinerary: 'bg-destructive/20 text-destructive hover:bg-destructive/30 font-bold',
    todayItinerary: 'bg-primary text-primary-foreground hover:bg-primary/90 font-bold ring-2 ring-primary ring-offset-2',
    futureItinerary: 'bg-primary/20 text-primary hover:bg-primary/30 font-bold',
  };

  // Get month range for calendar
  const dateRange = useMemo(() => {
    if (itinerary.length === 0) return { from: new Date(), to: new Date() };
    const dates = itinerary.map((i) => new Date(i.date));
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));
    return { from: minDate, to: maxDate };
  }, [itinerary]);

  return (
    <div className="bg-card rounded-lg shadow-lg p-6 mb-8">
      <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
        📅 Calendar View
      </h3>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-destructive/20 border border-destructive" />
          <span>Past Days</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-primary ring-2 ring-primary ring-offset-1" />
          <span>Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-primary/20 border border-primary" />
          <span>Upcoming</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendar */}
        <div className="flex-shrink-0">
          <Calendar
            mode="multiple"
            selected={itineraryDates}
            defaultMonth={dateRange.from}
            numberOfMonths={2}
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
            className="rounded-md border pointer-events-auto"
            onDayClick={onDayClick}
          />
        </div>

        {/* Day Details Panel */}
        <div className="flex-1 space-y-3">
          <h4 className="font-semibold text-lg mb-3">Itinerary Schedule</h4>
          {itinerary.length === 0 ? (
            <p className="text-muted-foreground">No days scheduled yet.</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {itinerary.map((item, index) => {
                const date = new Date(item.date);
                const isPastDay = isPast(date) && !isToday(date);
                const isTodayDay = isToday(date);
                const destination = destinations?.find((d) => d.id === item.destination_id);
                const activity = activities?.find((a) => a.id === item.activity_id);

                return (
                  <div
                    key={item.id}
                    className={cn(
                      'p-3 rounded-lg border transition-colors',
                      isPastDay && 'bg-destructive/10 border-destructive/30 opacity-75',
                      isTodayDay && 'bg-primary/10 border-primary ring-2 ring-primary/30',
                      !isPastDay && !isTodayDay && 'bg-muted/30 border-border'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={cn(
                              'text-xs font-medium px-2 py-0.5 rounded-full',
                              isPastDay && 'bg-destructive/20 text-destructive',
                              isTodayDay && 'bg-primary text-primary-foreground',
                              !isPastDay && !isTodayDay && 'bg-primary/20 text-primary'
                            )}
                          >
                            Day {index + 1}
                          </span>
                          {isPastDay && (
                            <span className="text-xs text-destructive font-medium">PAST</span>
                          )}
                          {isTodayDay && (
                            <span className="text-xs text-primary font-bold animate-pulse">TODAY</span>
                          )}
                        </div>
                        <p className="font-medium">{destination?.name || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(date, 'EEEE, MMMM d, yyyy')}
                        </p>
                        {activity && (
                          <p className="text-sm text-primary mt-1">
                            🎯 {activity.name}
                          </p>
                        )}
                      </div>
                      <div className="text-right text-xs text-muted-foreground space-y-1">
                        {item.wake_time && <p>⏰ Wake: {item.wake_time}</p>}
                        {item.breakfast_time && <p>🍳 Breakfast: {item.breakfast_time}</p>}
                        {item.lunch_time && <p>🍽️ Lunch: {item.lunch_time}</p>}
                        {item.dinner_time && <p>🍷 Dinner: {item.dinner_time}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
