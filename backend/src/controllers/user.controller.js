import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { uploadImage, deleteImage } from '../services/cloudinary.service.js';

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
const LINK_FIELDS = ['github', 'linkedin', 'portfolio', 'resume'];

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
    folder: 'teamup/avatars',
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
