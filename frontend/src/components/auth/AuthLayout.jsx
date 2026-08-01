import { Link } from 'react-router-dom';
import { ArrowRight, Users } from 'lucide-react';
import NetworkArt from './NetworkArt';

/**
 * AuthLayout — split-screen shell for the primary auth pages.
 *
 * Left: brand panel with the network illustration and a rotating-style tagline.
 * Right: the actual form (children).
 *
 * The left panel is decorative, so it's hidden below `lg` rather than stacked —
 * on a phone it would push the form below the fold for no benefit.
 */
export default function AuthLayout({ title, subtitle, children, footer, slide = 0 }) {
  return (
    <div className="min-h-[calc(100svh-4rem)] px-4 py-6 sm:px-6 lg:py-10">
      <div className="bg-card mx-auto grid w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200/70 shadow-soft lg:grid-cols-2">
        {/* ── Brand panel ──────────────────────────────────────────────── */}
        <div className="relative hidden overflow-hidden bg-brand-gradient-animated p-8 lg:flex lg:flex-col">
          {/* Depth: soft blooms behind the artwork. */}
          <div
            aria-hidden
            className="animate-blob pointer-events-none absolute -top-24 -left-20 h-72 w-72 rounded-full bg-white/20 blur-3xl"
          />
          <div
            aria-hidden
            className="animate-blob pointer-events-none absolute -right-16 bottom-10 h-64 w-64 rounded-full bg-pink-200/25 blur-3xl [animation-delay:-6s]"
          />

          <div className="relative flex items-center justify-between">
            <Link to="/" className="group inline-flex items-center gap-2 text-white">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/20 backdrop-blur-sm transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
                <Users className="h-[18px] w-[18px]" strokeWidth={2.5} />
              </span>
              <span className="text-[17px] font-bold tracking-tight">Squadly</span>
            </Link>

            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 text-[13px] font-medium text-white backdrop-blur-sm transition hover:bg-white/25"
            >
              Back to website
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="relative flex flex-1 items-center justify-center py-6">
            <NetworkArt className="h-full max-h-[340px] w-full max-w-[340px] drop-shadow-2xl" />
          </div>

          <div className="relative">
            <p className="text-[26px] leading-tight font-bold text-white">
              Find your people,
              <br />
              build something big
            </p>
            <p className="mt-2.5 max-w-sm text-sm text-white/75">
              Every great project starts with the right teammates.
            </p>

            {/* Decorative progress marks, echoing the reference design. */}
            <div aria-hidden className="mt-7 flex items-center gap-2">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={
                    i === slide
                      ? 'h-1 w-8 rounded-full bg-white transition-all'
                      : 'h-1 w-4 rounded-full bg-white/35 transition-all'
                  }
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Form panel ───────────────────────────────────────────────── */}
        <div className="flex items-center justify-center p-7 sm:p-10 lg:p-12">
          <div className="w-full max-w-sm">
            {/* Small screens lose the brand panel, so re-introduce the mark. */}
            <div className="mb-7 lg:hidden">
              <Link to="/" className="group inline-flex items-center gap-2">
                <span className="bg-brand-gradient grid h-9 w-9 place-items-center rounded-xl text-white shadow-sm">
                  <Users className="h-[18px] w-[18px]" strokeWidth={2.5} />
                </span>
                <span className="text-[17px] font-bold tracking-tight text-slate-900">Squadly</span>
              </Link>
            </div>

            <h1 className="text-[34px] leading-[1.1] font-extrabold tracking-tight text-slate-900">
              {title}
            </h1>
            {subtitle && <div className="mt-2.5 text-sm text-slate-500">{subtitle}</div>}

            <div className="mt-7">{children}</div>

            {footer && <div className="mt-6 text-sm text-slate-600">{footer}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
