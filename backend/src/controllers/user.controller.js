import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { uploadImage, deleteImage } from '../services/cloudinary.service.js';
import escapeRegex from '../utils/escapeRegex.js';

// Top-level profile fields the client may update directly.
const EDITABLE_FIELDS = [
  'name',
  'college',
  'department',
  'year',
  'bio',
  'skills',
  'hackathons',
  'projects',
  'availability',
  'workMode',
];
const LINK_FIELDS = ['github', 'linkedin', 'portfolio'];

/**
 * GET /users?search=<name>&limit=
 * Find registered students by name, college, or skill — the entry point for
 * "who is this person and what have they posted?".
 *
 * Returns only fields already visible on a public profile. Requires a search
 * term so this can't be used to enumerate the whole user base.
 */
export const searchUsers = asyncHandler(async (req, res) => {
  const term = req.query.search?.trim();
  if (!term || term.length < 2) {
    return res.json(new ApiResponse(200, { users: [] }, 'Search users'));
  }

  const limit = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 8));
  const rx = new RegExp(escapeRegex(term), 'i');

  const users = await User.find({
    $or: [{ name: rx }, { college: rx }, { skills: rx }],
  })
    .select('name avatar college department year skills')
    .limit(limit)
    .sort({ name: 1 });

  res.json(new ApiResponse(200, { users }, 'Search users'));
});

/**
 * GET /users/:id
 * Public profile view. Email and last-login are hidden for privacy.
 */
export const getProfileById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-email -lastLoginAt');
  if (!user) throw ApiError.notFound('User not found');
  res.json(new ApiResponse(200, { user }, 'Profile loaded'));
});

/**
 * PATCH /users/me
 * Update the current user's profile. Body is already validated + stripped by
 * the updateProfileSchema, so we only copy known fields.
 */
export const updateMyProfile = asyncHandler(async (req, res) => {
  const user = req.user;
  const updates = req.body;

  for (const field of EDITABLE_FIELDS) {
    if (updates[field] !== undefined) user[field] = updates[field];
  }

  if (updates.links) {
    for (const key of LINK_FIELDS) {
      if (updates.links[key] !== undefined) user.links[key] = updates.links[key];
    }
  }

  // Validate only the fields we touched (the doc was loaded without password).
  await user.save({ validateModifiedOnly: true });

  res.json(new ApiResponse(200, { user }, 'Profile updated'));
});

/**
 * POST /users/me/avatar   (multipart/form-data, field "avatar")
 * Upload/replace the current user's profile picture via Cloudinary.
 */
export const uploadMyAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No image file provided');

  // avatarPublicId is select:false, so load it explicitly to manage the image.
  const user = await User.findById(req.user.id).select('+avatarPublicId');

  // Stable public_id per user so re-uploads overwrite the previous image.
  const { url, publicId } = await uploadImage(req.file.buffer, {
    folder: 'squadly/avatars',
    publicId: `user_${user.id}`,
  });

  user.avatar = url;
  user.avatarPublicId = publicId;
  await user.save({ validateModifiedOnly: true });

  res.json(new ApiResponse(200, { user }, 'Profile picture updated'));
});

/**
 * DELETE /users/me/avatar
 * Remove the current user's profile picture.
 */
export const removeMyAvatar = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('+avatarPublicId');

  if (user.avatarPublicId) await deleteImage(user.avatarPublicId);
  user.avatar = '';
  user.avatarPublicId = '';
  await user.save({ validateModifiedOnly: true });

  res.json(new ApiResponse(200, { user }, 'Profile picture removed'));
});

/**
 * POST /users/me/resume   (multipart/form-data, field "resume")
 * Upload/replace the current user's resume (PDF).
 */
export const uploadMyResume = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No PDF file provided');

  const user = await User.findById(req.user.id).select('+resumePublicId');

  const { url, publicId } = await uploadImage(req.file.buffer, {
    folder: 'squadly/resumes',
    publicId: `resume_${user.id}`,
    resourceType: 'raw',
  });

  user.resumeUrl = url;
  user.resumePublicId = publicId;
  await user.save({ validateModifiedOnly: true });

  res.json(new ApiResponse(200, { user }, 'Resume uploaded'));
});

/**
 * DELETE /users/me/resume
 * Remove the current user's resume.
 */
export const removeMyResume = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('+resumePublicId');

  if (user.resumePublicId) await deleteImage(user.resumePublicId, { resourceType: 'raw' });
  user.resumeUrl = '';
  user.resumePublicId = '';
  await user.save({ validateModifiedOnly: true });

  res.json(new ApiResponse(200, { user }, 'Resume removed'));
});
