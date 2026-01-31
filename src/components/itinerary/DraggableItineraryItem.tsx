import { Draggable } from '@hello-pangea/dnd';
import { GripVertical, Trash2, Calendar, Hotel, MapPin, Car, Check, ExternalLink, ImageIcon, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculateDistance, estimateTravelTime, formatDistance } from '@/lib/utils';
import { getDestinationImage } from '@/lib/destinationImages';

interface ItineraryItemData {
  id: string;
  date: string;
  day_type: string;
  destination_id: string;
  origin_id: string | null;
  hotel_id: string | null;
  car_id: string | null;
  activity_id: string | null;
  notes: string | null;
  hotel_booked: boolean | null;
  activity_booked: boolean | null;
  hotel_cost: number | null;
  activity_cost: number | null;
  car_cost: number | null;
  transport_cost: number | null;
  other_cost: number | null;
}

interface DraggableItineraryItemProps {
  item: ItineraryItemData;
  index: number;
  destinations: Array<{ id: string; name: string; latitude: number | null; longitude: number | null }> | undefined;
  hotels: Array<{ id: string; name: string; destination_id: string }> | undefined;
  cars: Array<{ id: string; name: string }> | undefined;
  activities: Array<{ id: string; name: string; destination_id: string }> | undefined;
  onDelete: (id: string) => void;
  onUpdate: (id: string, field: string, value: string | boolean) => void;
  onToggleBooking: (id: string, field: 'hotel_booked' | 'activity_booked', currentValue: boolean) => void;
  getBookingUrl: (destinationId: string, type: 'destination' | 'hotel', hotelId?: string | null) => string | null;
  hotelBookingUrls: Record<string, string>;
  showCostInputs: boolean;
  hasActiveSubscription: boolean;
  requireSubscription: (callback: () => void) => void;
}

export const DraggableItineraryItem = ({
  item,
  index,
  destinations,
  hotels,
  cars,
  activities,
  onDelete,
  onUpdate,
  onToggleBooking,
  getBookingUrl,
  hotelBookingUrls,
  showCostInputs,
  hasActiveSubscription,
  requireSubscription,
}: DraggableItineraryItemProps) => {
  const destination = destinations?.find((d) => d.id === item.destination_id);
  const origin = destinations?.find((d) => d.id === item.origin_id);
  const hotel = hotels?.find((h) => h.id === item.hotel_id);
  const car = cars?.find((c) => c.id === item.car_id);
  const activity = activities?.find((a) => a.id === item.activity_id);
  
  const formattedDate = new Date(item.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const isTransfer = item.day_type === 'transfer';

  // Calculate distance and travel time for transfer days
  let distance: number | null = null;
  let travelTime: string | null = null;
  if (isTransfer && origin?.latitude && origin?.longitude && destination?.latitude && destination?.longitude) {
    distance = calculateDistance(
      origin.latitude,
      origin.longitude,
      destination.latitude,
      destination.longitude
    );
    travelTime = estimateTravelTime(distance);
  }

  // Get destination image
  const destinationImage = getDestinationImage(item.destination_id);
  const originImage = isTransfer ? getDestinationImage(item.origin_id || '') : null;

  return (
    <Draggable draggableId={item.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`border border-border rounded-lg overflow-hidden bg-background/50 transition-shadow ${
            snapshot.isDragging ? 'shadow-lg ring-2 ring-primary' : ''
          }`}
        >
          {/* Destination Image Header */}
          {destinationImage && (
            <div className="relative h-40 w-full overflow-hidden">
              <img 
                src={destinationImage} 
                alt={destination?.name || 'Destination'} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <div className="text-xs font-medium opacity-90">Day {index + 1}</div>
                {isTransfer && (
                  <span className="inline-block bg-yellow-500 text-yellow-900 px-2 py-0.5 rounded text-xs font-bold mb-1">
                    Transfer
                  </span>
                )}
                <h4 className="text-xl font-bold">
                  {isTransfer ? `${origin?.name || 'Origin'} → ${destination?.name || 'Destination'}` : destination?.name}
                </h4>
              </div>
              {/* Drag Handle on Image */}
              <div
                {...provided.dragHandleProps}
                className="absolute top-2 right-2 p-2 rounded-full bg-black/40 hover:bg-black/60 cursor-grab active:cursor-grabbing"
                title="Drag to reorder"
              >
                <GripVertical size={18} className="text-white" />
              </div>
            </div>
          )}

          <div className="p-5">
            {/* Fallback header when no image */}
            {!destinationImage && (
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <div
                    {...provided.dragHandleProps}
                    className="mt-1 p-1 rounded hover:bg-muted cursor-grab active:cursor-grabbing"
                    title="Drag to reorder"
                  >
                    <GripVertical size={20} className="text-muted-foreground" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="text-sm text-muted-foreground font-medium">Day {index + 1}</div>
                    {isTransfer && (
                      <span className="inline-block bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded text-xs font-medium mb-1">
                        Transfer
                      </span>
                    )}
                    <h4 className="text-2xl font-bold text-primary">
                      {isTransfer ? `${origin?.name || 'Origin'} → ${destination?.name || 'Destination'}` : destination?.name}
                    </h4>
                  </div>
                </div>
              </div>
            )}
            
            {/* Date and Travel Info */}
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="text-sm text-muted-foreground">
                  <Calendar size={14} className="inline mr-1" />
                  {formattedDate}
                </p>
                {isTransfer && distance && travelTime && (
                  <div className="mt-1 flex gap-4 text-sm">
                    <span className="text-primary font-medium">
                      📏 {formatDistance(distance)}
                    </span>
                    <span className="text-primary font-medium">
                      🕐 {travelTime}
                    </span>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(item.id)}
              >
                <Trash2 size={18} />
              </Button>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Date</label>
              <input
                type="date"
                value={item.date || ''}
                onChange={(e) => onUpdate(item.id, 'date', e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
              />
            </div>
            
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Hotel {isTransfer ? '(at destination)' : ''}
              </label>
              <select
                value={item.hotel_id || ''}
                onChange={(e) => onUpdate(item.id, 'hotel_id', e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
              >
                <option value="">Not selected</option>
                {hotels
                  ?.filter((h) => h.destination_id === item.destination_id)
                  .map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
              </select>
            </div>

            {!isTransfer && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Activity</label>
                <select
                  value={item.activity_id || ''}
                  onChange={(e) => onUpdate(item.id, 'activity_id', e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                >
                  <option value="">Not selected</option>
                  {activities
                    ?.filter((a) => a.destination_id === item.destination_id)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Car</label>
              <select
                value={item.car_id || ''}
                onChange={(e) => onUpdate(item.id, 'car_id', e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
              >
                <option value="">Not selected</option>
                {cars?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Hotel booking status */}
          {hotel && (
            <div className="flex items-center justify-between text-sm mb-2 p-2 rounded-md bg-muted/30">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onToggleBooking(item.id, 'hotel_booked', item.hotel_booked || false)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    item.hotel_booked 
                      ? 'bg-primary border-primary text-primary-foreground' 
                      : 'border-muted-foreground hover:border-primary'
                  }`}
                >
                  {item.hotel_booked && <Check size={12} />}
                </button>
                <Hotel size={16} className="text-muted-foreground" />
                <span className={item.hotel_booked ? 'line-through text-muted-foreground' : ''}>
                  {hotel.name}
                </span>
                {item.hotel_booked && (
                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Booked</span>
                )}
              </div>
              {(hotelBookingUrls[item.hotel_id || ''] || getBookingUrl(item.destination_id, 'hotel', item.hotel_id)) && !item.hotel_booked && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => requireSubscription(() => window.open(getBookingUrl(item.destination_id, 'hotel', item.hotel_id)!, '_blank'))}
                  className="ml-2"
                >
                  {!hasActiveSubscription && <Lock size={12} className="mr-1" />}
                  <ExternalLink size={14} className="mr-1" />
                  Book Hotel
                </Button>
              )}
            </div>
          )}

          {/* Car display */}
          {car && (
            <div className="flex items-center gap-2 text-sm mb-2 p-2 rounded-md bg-muted/30">
              <Car size={16} className="text-muted-foreground" />
              <span>{car.name}</span>
            </div>
          )}

          {/* Activity booking status */}
          {activity && (
            <div className="flex items-center justify-between text-sm mb-2 p-2 rounded-md bg-muted/30">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onToggleBooking(item.id, 'activity_booked', item.activity_booked || false)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    item.activity_booked 
                      ? 'bg-primary border-primary text-primary-foreground' 
                      : 'border-muted-foreground hover:border-primary'
                  }`}
                >
                  {item.activity_booked && <Check size={12} />}
                </button>
                <MapPin size={16} className="text-muted-foreground" />
                <span className={item.activity_booked ? 'line-through text-muted-foreground' : ''}>
                  {activity.name}
                </span>
                {item.activity_booked && (
                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Booked</span>
                )}
              </div>
              {getBookingUrl(item.destination_id, 'destination') && !item.activity_booked && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => requireSubscription(() => window.open(getBookingUrl(item.destination_id, 'destination')!, '_blank'))}
                  className="ml-2"
                >
                  {!hasActiveSubscription && <Lock size={12} className="mr-1" />}
                  <ExternalLink size={14} className="mr-1" />
                  Book Activity
                </Button>
              )}
            </div>
          )}

          {/* Cost inputs */}
          {showCostInputs && (
            <div className="mt-4 p-3 bg-muted/20 rounded-lg border border-border">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {hotel && (
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Hotel ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.hotel_cost || ''}
                      onChange={(e) => onUpdate(item.id, 'hotel_cost', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-input rounded bg-background"
                      placeholder="0.00"
                    />
                  </div>
                )}
                {activity && (
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Activity ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.activity_cost || ''}
                      onChange={(e) => onUpdate(item.id, 'activity_cost', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-input rounded bg-background"
                      placeholder="0.00"
                    />
                  </div>
                )}
                {car && (
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Car/Day ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.car_cost || ''}
                      onChange={(e) => onUpdate(item.id, 'car_cost', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-input rounded bg-background"
                      placeholder="0.00"
                    />
                  </div>
                )}
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Transport ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.transport_cost || ''}
                    onChange={(e) => onUpdate(item.id, 'transport_cost', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-input rounded bg-background"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Other ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.other_cost || ''}
                    onChange={(e) => onUpdate(item.id, 'other_cost', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-input rounded bg-background"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="mt-2 text-right text-sm font-medium text-emerald-700 dark:text-emerald-300">
                Day Total: ${((Number(item.hotel_cost) || 0) + (Number(item.activity_cost) || 0) + 
                  (Number(item.car_cost) || 0) + (Number(item.transport_cost) || 0) + (Number(item.other_cost) || 0)).toFixed(2)}
              </div>
            </div>
          )}
          </div>
        </div>
      )}
    </Draggable>
  );
};
