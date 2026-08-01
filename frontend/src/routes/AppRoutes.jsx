import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import RootLayout from '@/components/layout/RootLayout';
import ProtectedRoute from './ProtectedRoute';
import GuestRoute from './GuestRoute';
import { Spinner } from '@/components/ui';

/**
 * Pages are lazy-loaded so each route ships as its own chunk (code-splitting).
 * This keeps the initial bundle small — users only download the code for the
 * page they're on. A <Suspense> fallback covers the brief chunk fetch.
 */
const HomePage = lazy(() => import('@/pages/HomePage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const BrowsePage = lazy(() => import('@/pages/BrowsePage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const MyLibraryPage = lazy(() => import('@/pages/MyLibraryPage'));
const ChatPage = lazy(() => import('@/pages/ChatPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const EditProfilePage = lazy(() => import('@/pages/EditProfilePage'));
const CreatePostPage = lazy(() => import('@/pages/posts/CreatePostPage'));
const EditPostPage = lazy(() => import('@/pages/posts/EditPostPage'));
const PostDetailPage = lazy(() => import('@/pages/posts/PostDetailPage'));
const MyPostsPage = lazy(() => import('@/pages/posts/MyPostsPage'));
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('@/pages/auth/VerifyEmailPage'));

function PageLoader() {
  return (
    <div className="grid min-h-[60vh] place-items-center text-brand-600">
      <Spinner size="lg" />
    </div>
  );
}

/**
 * Application route table. All routes render inside RootLayout.
 *   - Guest-only routes (login/register/…) redirect away if already logged in.
 *   - Protected routes (dashboard/…) redirect to /login if logged out.
 *   - /verify-email is public because the link is opened from an email.
 */
export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
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
            {/* Interests + saved merged into one tabbed page. The old paths
                redirect so existing links and bookmarks keep working. */}
            <Route path="library" element={<MyLibraryPage />} />
            <Route path="my-interests" element={<Navigate to="/library" replace />} />
            <Route path="saved" element={<Navigate to="/library?tab=saved" replace />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="chat/:conversationId" element={<ChatPage />} />
            <Route path="posts/new" element={<CreatePostPage />} />
            <Route path="posts/:id/edit" element={<EditPostPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
