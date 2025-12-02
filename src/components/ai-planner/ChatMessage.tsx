import { Bot, User, MapPin, Hotel, Calendar, DollarSign, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';

type MessageProps = {
  role: 'user' | 'assistant';
  content: string;
};

const formatContent = (text: string) => {
  // Remove markdown asterisks and format nicely
  let formatted = text
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold markers
    .replace(/\*([^*]+)\*/g, '$1') // Remove italic markers
    .replace(/#{1,3}\s*/g, ''); // Remove headers

  return formatted;
};

const parseItinerarySection = (content: string) => {
  const lines = content.split('\n');
  const sections: { type: string; content: string }[] = [];
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;
    
    // Detect day headers
    if (/^(Day\s*\d+|DAY\s*\d+)/i.test(trimmed)) {
      sections.push({ type: 'day', content: formatContent(trimmed) });
    }
    // Detect destinations/locations
    else if (/^(Destination|Location|Place):/i.test(trimmed) || trimmed.includes('📍')) {
      sections.push({ type: 'destination', content: formatContent(trimmed.replace(/^(Destination|Location|Place):\s*/i, '')) });
    }
    // Detect hotels/accommodation
    else if (/^(Hotel|Accommodation|Stay|Lodge):/i.test(trimmed) || trimmed.includes('🏨')) {
      sections.push({ type: 'hotel', content: formatContent(trimmed.replace(/^(Hotel|Accommodation|Stay|Lodge):\s*/i, '')) });
    }
    // Detect activities
    else if (/^(Activity|Activities|Morning|Afternoon|Evening):/i.test(trimmed) || trimmed.includes('🎯')) {
      sections.push({ type: 'activity', content: formatContent(trimmed.replace(/^(Activity|Activities):\s*/i, '')) });
    }
    // Detect costs/budget
    else if (/^(Cost|Budget|Price|Estimated):/i.test(trimmed) || trimmed.includes('💰')) {
      sections.push({ type: 'cost', content: formatContent(trimmed.replace(/^(Cost|Budget|Price|Estimated Cost):\s*/i, '')) });
    }
    // Detect numbered lists
    else if (/^\d+\.\s/.test(trimmed)) {
      sections.push({ type: 'list', content: formatContent(trimmed) });
    }
    // Regular text
    else {
      sections.push({ type: 'text', content: formatContent(trimmed) });
    }
  });
  
  return sections;
};

const SectionIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'day':
      return <Calendar className="w-4 h-4" />;
    case 'destination':
      return <MapPin className="w-4 h-4" />;
    case 'hotel':
      return <Hotel className="w-4 h-4" />;
    case 'activity':
      return <Compass className="w-4 h-4" />;
    case 'cost':
      return <DollarSign className="w-4 h-4" />;
    default:
      return null;
  }
};

const ChatMessage = ({ role, content }: MessageProps) => {
  const isAssistant = role === 'assistant';
  const sections = isAssistant ? parseItinerarySection(content) : [];
  
  return (
    <div className={cn(
      "flex gap-3",
      isAssistant ? "justify-start" : "justify-end"
    )}>
      {isAssistant && (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0 shadow-lg">
          <Bot className="w-5 h-5 text-primary-foreground" />
        </div>
      )}
      
      <div className={cn(
        "max-w-[85%] rounded-2xl shadow-md",
        isAssistant 
          ? "bg-card border border-border/50" 
          : "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
      )}>
        {isAssistant ? (
          <div className="p-4 space-y-2">
            {sections.map((section, idx) => (
              <div key={idx} className={cn(
                "transition-all",
                section.type === 'day' && "font-bold text-primary text-lg border-b border-primary/20 pb-2 mt-4 first:mt-0 flex items-center gap-2",
                section.type === 'destination' && "flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-lg",
                section.type === 'hotel' && "flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 rounded-lg",
                section.type === 'activity' && "flex items-center gap-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-3 py-1.5 rounded-lg",
                section.type === 'cost' && "flex items-center gap-2 text-purple-600 dark:text-purple-400 font-medium bg-purple-50 dark:bg-purple-950/30 px-3 py-1.5 rounded-lg",
                section.type === 'list' && "pl-4 text-muted-foreground",
                section.type === 'text' && "text-foreground/90 leading-relaxed"
              )}>
                <SectionIcon type={section.type} />
                <span>{section.content}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-4 py-3 text-sm">{content}</p>
        )}
      </div>
      
      {!isAssistant && (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-secondary/60 flex items-center justify-center flex-shrink-0 shadow-md">
          <User className="w-5 h-5 text-secondary-foreground" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
