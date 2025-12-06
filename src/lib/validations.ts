import { z } from 'zod';

// Review validation schema
export const reviewSchema = z.object({
  destinationId: z.string().min(1, 'Please select a destination'),
  rating: z.number().min(1).max(5),
  comment: z.string()
    .trim()
    .min(10, 'Review must be at least 10 characters')
    .max(1000, 'Review must be less than 1000 characters'),
});

// Custom tour request validation schema
export const customRequestSchema = z.object({
  message: z.string()
    .trim()
    .min(20, 'Please provide more details (at least 20 characters)')
    .max(2000, 'Request must be less than 2000 characters'),
});

// Itinerary notes validation schema
export const itineraryNotesSchema = z.object({
  notes: z.string()
    .trim()
    .max(500, 'Notes must be less than 500 characters')
    .optional()
    .or(z.literal('')),
});

// AI planner message validation
export const aiPlannerMessageSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().max(5000, 'Message too long'),
  })).max(50, 'Too many messages in conversation'),
  destinations: z.array(z.any()).optional(),
  hotels: z.array(z.any()).optional(),
  activities: z.array(z.any()).optional(),
});

// Email request validation
export const packageEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
  userName: z.string().min(1).max(100),
  packageTitle: z.string().min(1).max(200),
  packageContent: z.string().min(1).max(50000),
  packageType: z.enum(['ai-planner', 'itinerary']),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
export type CustomRequestInput = z.infer<typeof customRequestSchema>;
export type ItineraryNotesInput = z.infer<typeof itineraryNotesSchema>;
