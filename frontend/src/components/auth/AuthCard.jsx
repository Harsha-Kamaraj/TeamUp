import { Card, Container } from '@/components/ui';
import Logo from '@/components/layout/Logo';

/**
 * AuthCard — shared centered layout for auth pages (login, register, etc.).
 * Renders the logo, a title/subtitle, the form (children), and an optional
 * footer slot (e.g. "Don't have an account? Sign up").
 */
export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <Container className="flex min-h-[calc(100svh-4rem)] items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo className="mb-6" />
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>}
        </div>

        <Card className="p-6 sm:p-8">{children}</Card>

        {footer && <div className="mt-6 text-center text-sm text-slate-600">{footer}</div>}
      </div>
    </Container>
  );
}
