import { Link } from 'react-router-dom';
import { Button, Card, Container } from '@/components/ui';

const CATEGORIES = [
  'Hackathons',
  'Research',
  'Startups',
  'Competitions',
  'Open Source',
  'Club Activities',
];

const FEATURES = [
  {
    icon: '🔍',
    title: 'Find the right teammates',
    body: 'Search by skill, college, category, and availability to build a balanced team fast.',
  },
  {
    icon: '⚡',
    title: 'Show interest in one click',
    body: 'Express interest, get notified, and start a conversation without the awkward cold DMs.',
  },
  {
    icon: '💬',
    title: 'Chat & collaborate in real time',
    body: 'Message, share resumes, and coordinate — all in one place, built for students.',
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-brand-50/70 to-white" />
        <Container className="py-20 text-center sm:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700">
            🚀 Built for students, by students
          </span>

          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
            Find your team for the{' '}
            <span className="bg-gradient-to-r from-brand-600 to-violet-600 bg-clip-text text-transparent">
              next big thing
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
            TeamUp connects students for hackathons, research, startups, competitions, and
            open-source — so you never have to build alone.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/register">
              <Button size="lg">Get started — it&apos;s free</Button>
            </Link>
            <Link to="/browse">
              <Button size="lg" variant="outline">
                Browse opportunities
              </Button>
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            {CATEGORIES.map((category) => (
              <span
                key={category}
                className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm text-slate-600 shadow-sm"
              >
                {category}
              </span>
            ))}
          </div>
        </Container>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-20">
        <Container>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <Card key={feature.title} hover>
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-2xl">
                  {feature.icon}
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.body}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>
    </div>
  );
}
