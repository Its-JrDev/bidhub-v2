import { z } from 'zod';

export const bidSchema = z.object({
  amount: z.number().positive('El monto debe ser mayor a 0'),
});

export type BidFormValues = z.infer<typeof bidSchema>;
