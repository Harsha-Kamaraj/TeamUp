import { Routes, Route } from 'react-router-dom';
import RootLayout from '@/components/layout/RootLayout';
import ProtectedRoute from './ProtectedRoute';
import GuestRoute from './GuestRoute';

import HomePage from '@/pages/HomePage';
import NotFoundPage from '@/pages/NotFoundPage';
import BrowsePage from '@/pages/BrowsePage';
import DashboardPage from '@/pages/DashboardPage';
import MyInterestsPage from '@/pages/MyInterestsPage';
import SavedPostsPage from '@/pages/SavedPostsPage';
import ChatPage from '@/pages/ChatPage';
import ProfilePage from '@/pages/ProfilePage';
import EditProfilePage from '@/pages/EditProfilePage';
import CreatePostPage from '@/pages/posts/CreatePostPage';
import EditPostPage from '@/pages/posts/EditPostPage';
import PostDetailPage from '@/pages/posts/PostDetailPage';
import MyPostsPage from '@/pages/posts/MyPostsPage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import VerifyEmailPage from '@/pages/auth/VerifyEmailPage';

/**
 * Application route table. All routes render inside RootLayout.
 *   - Guest-only routes (login/register/…) redirect away if already logged in.
 *   - Protected routes (dashboard/…) redirect to /login if logged out.
 *   - /verify-email is public because the link is opened from an email.
 */
export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<HomePage />} />

        {/* Guest-only */}
        <Route element={<GuestRoute />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* Public read-only: browse the feed, view posts + profiles, verify email */}
        <Route path="browse" element={<BrowsePage />} />
        <Route path="posts/:id" element={<PostDetailPage />} />
        <Route path="profile/:id" element={<ProfilePage />} />
        <Route path="verify-email" element={<VerifyEmailPage />} />

        {/* Authenticated only */}
        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="settings/profile" element={<EditProfilePage />} />
          <Route path="my-posts" element={<MyPostsPage />} />
          <Route path="my-interests" element={<MyInterestsPage />} />
          <Route path="saved" element={<SavedPostsPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="chat/:conversationId" element={<ChatPage />} />
          <Route path="posts/new" element={<CreatePostPage />} />
          <Route path="posts/:id/edit" element={<EditPostPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
