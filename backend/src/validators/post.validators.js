import { z } from 'zod';
import { POST_TYPES, POST_MODES, POST_STATUSES } from '../models/Post.js';

const tag = z.string().trim().min(1).max(40);

// Treat '' / null as "not provided" for the optional deadline.
const emptyToUndefined = (v) => (v === '' || v == null ? undefined : v);

const baseFields = {
  type: z.enum(POST_TYPES),
  title: z.string().trim().min(5, 'Title must be at least 5 characters').max(120),
  description: z.string().trim().min(20, 'Description must be at least 20 characters').max(5000),
  requiredSkills: z.array(tag).max(30, 'At most 30 skills').optional().default([]),
  membersNeeded: z.coerce
    .number({ error: 'Members needed must be a number' })
    .int('Must be a whole number')
    .min(1, 'At least 1 member')
    .max(50, 'At most 50 members'),
  mode: z.enum(POST_MODES),
  location: z.string().trim().max(120).optional().default(''),
  deadline: z.preprocess(emptyToUndefined, z.coerce.date({ error: 'Invalid date' }).optional()),
  tags: z.array(tag).max(15, 'At most 15 tags').optional().default([]),
};

export const createPostSchema = z.object(baseFields);

// All fields optional on update, plus the ability to open/close the post.
export const updatePostSchema = z
  .object({ ...baseFields, status: z.enum(POST_STATUSES) })
  .partial();
