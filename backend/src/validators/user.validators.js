import { z } from 'zod';
import { YEAR_OPTIONS, AVAILABILITY_OPTIONS, WORK_MODE_OPTIONS } from '../models/User.js';

// A field that is either empty or a valid http(s) URL.
const urlOrEmpty = z
  .string()
  .trim()
  .max(300, 'URL is too long')
  .refine((v) => v === '' || /^https?:\/\/.+/i.test(v), 'Enter a valid URL (starting with http)');

const skill = z.string().trim().min(1).max(40);

const project = z.object({
  title: z.string({ error: 'Project title is required' }).trim().min(1, 'Title is required').max(120),
  description: z.string().trim().max(400).optional().default(''),
  url: urlOrEmpty.optional().default(''),
});

/**
 * Partial update of the current user's profile. Every field is optional, so
 * the client can send just what changed. Unknown keys are stripped by Zod.
 */
export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60),
    college: z.string().trim().max(120),
    department: z.string().trim().max(120),
    year: z.enum(YEAR_OPTIONS),
    bio: z.string().trim().max(600, 'Bio must be at most 600 characters'),
    skills: z.array(skill).max(30, 'At most 30 skills'),
    links: z
      .object({
        github: urlOrEmpty,
        linkedin: urlOrEmpty,
        portfolio: urlOrEmpty,
        resume: urlOrEmpty,
      })
      .partial(),
    hackathons: z.array(z.string().trim().min(1).max(120)).max(30),
    projects: z.array(project).max(20, 'At most 20 projects'),
    availability: z.enum(AVAILABILITY_OPTIONS),
    workMode: z.enum(WORK_MODE_OPTIONS),
  })
  .partial();
