import { Container } from '@/components/ui';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200/70 bg-slate-50/60">
      <Container className="flex flex-col items-center justify-between gap-4 py-8 sm:flex-row">
        <div className="flex flex-col items-center gap-2 sm:items-start">
          <Logo />
          <p className="text-sm text-slate-500">Find your team. Build something great.</p>
        </div>
        <p className="text-sm text-slate-400">
          © {new Date().getFullYear()} TeamUp. Built for students.
        </p>
      </Container>
    </footer>
  );
}
