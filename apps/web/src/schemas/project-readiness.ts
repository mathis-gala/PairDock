import { developerProjectReadinessSchema } from '@pairdock/shared-contracts';
import { z } from 'zod';

export const projectReadinessSnapshotSchema = developerProjectReadinessSchema.extend({
  updatedAt: z.iso.datetime(),
});

export type ProjectReadinessSnapshot = z.infer<typeof projectReadinessSnapshotSchema>;
