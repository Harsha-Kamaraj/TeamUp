import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Code2, Briefcase, Globe, FileText } from 'lucide-react';
import { userApi } from '@/api/userApi';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, Avatar, Badge, Button, Card, Container, Spinner } from '@/components/ui';
import MessageButton from '@/components/chat/MessageButton';
import { AVAILABILITY, WORK_MODE } from '@/lib/profileOptions';

const LINK_META = {
  github: { label: 'GitHub', Icon: Code2 },
  linkedin: { label: 'LinkedIn', Icon: Briefcase },
  portfolio: { label: 'Portfolio', Icon: Globe },
};

function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">{title}</h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export default function ProfilePage() {
  const { id } = useParams();
  const { user: me } = useAuth();
  const isOwnProfile = me?.id === id;

  const {
    data: user,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['profile', id],
    queryFn: () => userApi.getProfile(id),
  });

  if (isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-brand-600">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <Container className="py-16">
        <Alert variant="error">
          {error?.response?.status === 404
            ? 'This profile could not be found.'
            : 'Something went wrong loading this profile.'}
        </Alert>
        <Link to="/" className="mt-4 inline-block">
          <Button variant="outline">Back to home</Button>
        </Link>
      </Container>
    );
  }

  const availability = AVAILABILITY[user.availability] ?? AVAILABILITY.available;
  const activeLinks = Object.entries(user.links ?? {}).filter(([k, v]) => v && k !== 'resume');
  const meta = [user.college, user.department, user.year].filter(Boolean).join(' · ');

  return (
    <Container className="py-10">
      {/* Header */}
      <Card className="animate-fade-up p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <Avatar name={user.name} src={user.avatar} size="xl" />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
              <Badge variant={availability.variant}>{availability.label}</Badge>
            </div>
            {meta && <p className="mt-1 text-slate-600">{meta}</p>}
            <p className="mt-1 text-sm text-slate-500">
              Prefers <span className="font-medium">{WORK_MODE[user.workMode] ?? 'Any'}</span> work
            </p>
            {user.bio && <p className="mt-4 leading-relaxed text-slate-700">{user.bio}</p>}

            {(activeLinks.length > 0 || user.resumeUrl) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {activeLinks.map(([key, url]) => {
                  const LinkIcon = LINK_META[key]?.Icon;
                  return (
                    <a key={key} href={url} target="_blank" rel="noreferrer noopener">
                      <Button variant="outline" size="sm">
                        {LinkIcon && <LinkIcon className="h-4 w-4" />}
                        {LINK_META[key]?.label ?? key}
                      </Button>
                    </a>
                  );
                })}
                {user.resumeUrl && (
                  <a href={user.resumeUrl} target="_blank" rel="noreferrer noopener">
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4" /> Resume
                    </Button>
                  </a>
                )}
              </div>
            )}
          </div>

          {isOwnProfile ? (
            <Link to="/settings/profile">
              <Button variant="secondary" size="sm">
                Edit profile
              </Button>
            </Link>
          ) : (
            me && <MessageButton userId={user.id} variant="secondary" size="sm" />
          )}
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Skills */}
        <Card className="lg:col-span-1">
          <Section title="Skills">
            {user.skills?.length ? (
              <div className="flex flex-wrap gap-2">
                {user.skills.map((skill) => (
                  <Badge key={skill}>{skill}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No skills listed yet.</p>
            )}
          </Section>

          {user.hackathons?.length > 0 && (
            <div className="mt-6">
              <Section title="Previous Hackathons">
                <ul className="space-y-1.5 text-sm text-slate-700">
                  {user.hackathons.map((h, i) => (
                    <li key={`${h}-${i}`} className="flex items-start gap-2">
                      <span aria-hidden>🏆</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            </div>
          )}
        </Card>

        {/* Projects */}
        <Card className="lg:col-span-2">
          <Section title="Projects">
            {user.projects?.length ? (
              <div className="space-y-4">
                {user.projects.map((project, i) => (
                  <div key={`${project.title}-${i}`} className="rounded-xl border border-slate-100 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-slate-900">{project.title}</h3>
                      {project.url && (
                        <a
                          href={project.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-sm font-medium text-brand-600 hover:text-brand-700"
                        >
                          Visit →
                        </a>
                      )}
                    </div>
                    {project.description && (
                      <p className="mt-1 text-sm text-slate-600">{project.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No projects added yet.</p>
            )}
          </Section>
        </Card>
      </div>
    </Container>
  );
}
