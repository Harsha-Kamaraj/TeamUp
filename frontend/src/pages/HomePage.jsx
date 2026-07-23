import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Search,
  MousePointerClick,
  MessagesSquare,
  Sparkles,
} from 'lucide-react';
import { Button, Container } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

const CATEGORIES = [
  { label: 'Hackathons', emoji: '💻' },
  { label: 'Research', emoji: '🔬' },
  { label: 'Startups', emoji: '🚀' },
  { label: 'Competitions', emoji: '🏆' },
  { label: 'Open source', emoji: '🌐' },
  { label: 'Fests & more', emoji: '🎉' },
];

const FEATURES = [
  {
    Icon: Search,
    emoji: '🔎',
    title: 'Find the right teammates',
    body: 'Search by skill, category, and work mode to build a balanced squad fast.',
  },
  {
    Icon: MousePointerClick,
    emoji: '👋',
    title: 'Show interest in one tap',
    body: 'Express interest, get notified, and start chatting — no awkward cold DMs.',
  },
  {
    Icon: MessagesSquare,
    emoji: '💬',
    title: 'Chat & manage your squad',
    body: 'Message in real time, accept teammates, and track your crew in one place.',
  },
];

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Animated color blobs */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="animate-blob absolute -top-24 -left-16 h-72 w-72 rounded-full bg-brand-400/30 blur-3xl" />
          <div className="animate-blob absolute -top-10 right-0 h-80 w-80 rounded-full bg-pink-400/25 blur-3xl [animation-delay:-4s]" />
          <div className="animate-blob absolute top-40 left-1/3 h-72 w-72 rounded-full bg-violet-400/25 blur-3xl [animation-delay:-8s]" />
        </div>

        <Container className="py-24 text-center sm:py-28">
          <span className="animate-fade-up inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-card-blur px-3.5 py-1.5 text-[13px] font-medium text-brand-700 shadow-xs backdrop-blur-sm dark:border-brand-400/40 dark:text-brand-300">
            <Sparkles className="h-3.5 w-3.5" /> Built for students, by students 🎓
          </span>

          <h1 className="animate-fade-up mx-auto mt-7 max-w-3xl text-[40px] leading-[1.08] font-extrabold tracking-tight text-slate-900 sm:text-6xl [animation-delay:80ms]">
            Find your squad for the <span className="text-brand-gradient">next big thing</span> 🎉
          </h1>

          <p className="animate-fade-up mx-auto mt-6 max-w-xl text-lg text-slate-500 [animation-delay:160ms]">
            Squadly connects students for hackathons, research, startups, competitions, fests, and
            open-source — so you never have to build alone.
          </p>

          <div className="animate-fade-up mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row [animation-delay:240ms]">
            {isAuthenticated ? (
              <>
                <Link to="/browse">
                  <Button size="lg">
                    Go to Your Feed <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/posts/new">
                  <Button size="lg" variant="outline">
                    Create post
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/register">
                  <Button size="lg">
                    Sign up — it&apos;s free <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline">
                    Log in
                  </Button>
                </Link>
              </>
            )}
          </div>

          <div className="animate-fade-up mt-11 flex flex-wrap items-center justify-center gap-2 [animation-delay:320ms]">
            {CATEGORIES.map(({ label, emoji }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-card-blur px-3.5 py-1.5 text-sm text-slate-600 shadow-xs backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-sm"
              >
                <span aria-hidden>{emoji}</span> {label}
              </span>
            ))}
          </div>
        </Container>
      </section>

      {/* Features */}
      <section className="bg-card-blur border-t border-slate-200/70 backdrop-blur-sm">
        <Container className="py-20">
          <div className="mx-auto mb-14 max-w-xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Everything you need to build your squad ✨
            </h2>
            <p className="mt-3 text-slate-500">From finding teammates to managing your crew.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {FEATURES.map(({ Icon, emoji, title, body }, i) => (
              <div
                key={title}
                className="animate-fade-up bg-card rounded-2xl border border-slate-200/80 p-6 shadow-card transition duration-200 hover:-translate-y-1 hover:border-brand-200 hover:shadow-soft"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <div className="bg-brand-gradient grid h-11 w-11 place-items-center rounded-xl text-white shadow-sm">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-base font-bold text-slate-900">
                  {emoji} {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Closing CTA */}
      <section className="pb-20 pt-16">
        <Container>
          <div className="bg-brand-gradient-animated relative overflow-hidden rounded-3xl px-8 py-16 text-center shadow-soft">
            <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Ready to find your squad? 🙌
            </h2>
            <p className="mx-auto mt-3 max-w-md text-white/90">
              Join Squadly and turn your next idea into a project with the right people.
            </p>
            <Link to={isAuthenticated ? '/browse' : '/register'} className="mt-8 inline-block">
              <Button
                size="lg"
                className="bg-white text-brand-700 shadow-sm hover:bg-brand-50 hover:brightness-100"
              >
                {isAuthenticated ? 'Explore Your Feed' : 'Create your free account'}{' '}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}
