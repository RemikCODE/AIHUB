import { z } from 'zod';

export const courseSchema = z.object({
  title: z.string()
    .trim()
    .min(1, { message: "Tytuł kursu jest wymagany" })
    .max(200, { message: "Tytuł nie może przekraczać 200 znaków" }),
  description: z.string()
    .trim()
    .max(2000, { message: "Opis nie może przekraczać 2000 znaków" })
    .optional()
    .or(z.literal('')),
  price_cents: z.number()
    .int({ message: "Cena musi być liczbą całkowitą" })
    .min(0, { message: "Cena nie może być ujemna" })
    .max(10000000, { message: "Cena nie może przekraczać 100 000 PLN" }),
  stripe_price_id: z.string()
    .trim()
    .max(100, { message: "Stripe Price ID nie może przekraczać 100 znaków" })
    .optional()
    .or(z.literal('')),
});

export const lessonSchema = z.object({
  title: z.string()
    .trim()
    .min(1, { message: "Tytuł lekcji jest wymagany" })
    .max(200, { message: "Tytuł nie może przekraczać 200 znaków" }),
  content: z.string()
    .trim()
    .max(50000, { message: "Treść nie może przekraczać 50 000 znaków" })
    .optional()
    .or(z.literal('')),
  video_url: z.string()
    .trim()
    .url({ message: "Nieprawidłowy format URL" })
    .max(500, { message: "URL nie może przekraczać 500 znaków" })
    .optional()
    .or(z.literal('')),
  is_preview: z.boolean(),
});

export type CourseFormData = z.infer<typeof courseSchema>;
export type LessonFormData = z.infer<typeof lessonSchema>;
