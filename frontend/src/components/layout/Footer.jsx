import { Link } from 'react-router-dom';
import { Container } from '@/components/ui';
import Logo from './Logo';

// Brand icons (lucide dropped these, so we inline the marks).
function GitHubIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.05-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.09 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 016 0c2.29-1.55 3.29-1.23 3.29-1.23.66 1.65.25 2.87.12 3.17.77.84 1.24 1.91 1.24 3.22 0 4.62-2.81 5.64-5.49 5.94.43.37.81 1.1.81 2.22 0 1.6-.01 2.9-.01 3.29 0 .32.22.7.83.58C20.56 22.29 24 17.8 24 12.5 24 5.87 18.63.5 12 .5z" />
    </svg>
  );
}

function LinkedInIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 110-4.13 2.06 2.06 0 010 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

const EXPLORE_LINKS = [
  { label: 'Your Feed', to: '/browse' },
  { label: 'Create post', to: '/posts/new' },
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Saved posts', to: '/saved' },
];

const CREATORS = [
  {
    name: 'Harsha K',
    github: 'https://github.com/Harsha-Kamaraj',
    linkedin: 'https://www.linkedin.com/in/harshak2006/',
  },
  {
    name: 'Gagandeep N',
    github: 'https://github.com/Gagan-1718',
    linkedin: 'https://www.linkedin.com/in/gagandeep1718/',
  },
];

function SocialLink({ href, label, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={label}
      className="text-slate-400 transition-colors hover:text-brand-600"
    >
      {children}
    </a>
  );
}

export default function Footer() {
  return (
    <footer className="bg-card-blur mt-auto border-t border-slate-200">
      <Container className="py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12">
          {/* Brand + tagline */}
          <div className="lg:col-span-5">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">
              Find your squad for hackathons, research, startups, competitions, fests, and more —
              so you never have to build alone. 💜
            </p>
          </div>

          {/* Explore */}
          <div className="lg:col-span-3">
            <h3 className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Explore</h3>
            <ul className="mt-4 space-y-3">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-slate-600 transition-colors hover:text-brand-700"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Created by */}
          <div className="lg:col-span-4">
            <h3 className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
              Created by
            </h3>
            <ul className="mt-4 space-y-3">
              {CREATORS.map((person) => (
                <li key={person.name} className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-800">{person.name}</span>
                  <SocialLink href={person.github} label={`${person.name} on GitHub`}>
                    <GitHubIcon className="h-4 w-4" />
                  </SocialLink>
                  <SocialLink href={person.linkedin} label={`${person.name} on LinkedIn`}>
                    <LinkedInIcon className="h-[18px] w-[18px]" />
                  </SocialLink>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-slate-100 pt-6 text-center text-sm text-slate-400 sm:text-left">
          © {new Date().getFullYear()} Squadly · Built for students, by students.
        </div>
      </Container>
    </footer>
  );
}
