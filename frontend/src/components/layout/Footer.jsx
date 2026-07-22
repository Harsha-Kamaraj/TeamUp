import { Container } from '@/components/ui';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white/70">
      <Container className="flex flex-col items-center justify-between gap-3 py-6 sm:flex-row">
        <Logo />
        <p className="text-sm text-slate-400">
          © {new Date().getFullYear()} Squadly · Built for students, by students. 💜
        </p>
      </Container>
    </footer>
  );
}
