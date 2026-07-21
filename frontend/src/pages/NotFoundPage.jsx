import { Link } from 'react-router-dom';
import { Button, Container } from '@/components/ui';

export default function NotFoundPage() {
  return (
    <Container className="flex flex-col items-center justify-center py-28 text-center">
      <p className="text-7xl font-extrabold text-brand-600">404</p>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Page not found</h1>
      <p className="mt-2 max-w-md text-slate-600">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <Link to="/" className="mt-8">
        <Button size="lg">Back to home</Button>
      </Link>
    </Container>
  );
}
