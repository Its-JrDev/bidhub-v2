import { z } from 'zod';

export const createAuctionSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  description: z.string().min(5, 'La descripción debe tener al menos 5 caracteres'),
  categoryId: z.string().min(1, 'Selecciona una categoría'),
  startingPrice: z.number().positive('El precio inicial debe ser mayor a 0'),
  minIncrement: z.number().positive('El incremento mínimo debe ser mayor a 0'),
  imageUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  endsAt: z.string().min(1, 'La fecha de cierre es obligatoria'),
});

export type CreateAuctionFormValues = z.infer<typeof createAuctionSchema>;
