import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { userApi } from '@/api/userApi';
import {
  Alert,
  Avatar,
  Button,
  Card,
  Container,
  Input,
  Select,
  Textarea,
  TagInput,
} from '@/components/ui';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { YEAR_OPTIONS, AVAILABILITY_OPTIONS, WORK_MODE_OPTIONS } from '@/lib/profileOptions';

function SectionCard({ title, description, children }) {
  return (
    <Card className="p-6">
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      <div className="mt-5 space-y-4">{children}</div>
    </Card>
  );
}

/** Avatar upload/remove — updates the auth context user directly. */
function AvatarField() {
  const { user, updateCurrentUser } = useAuth();
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      updateCurrentUser(await userApi.uploadAvatar(file));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };

  const onRemove = async () => {
    setBusy(true);
    setError('');
    try {
      updateCurrentUser(await userApi.removeAvatar());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SectionCard title="Profile picture">
      <div className="flex items-center gap-5">
        <Avatar name={user.name} src={user.avatar} size="lg" />
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" loading={busy} onClick={() => fileRef.current?.click()}>
              Upload photo
            </Button>
            {user.avatar && (
              <Button variant="ghost" size="sm" disabled={busy} onClick={onRemove}>
                Remove
              </Button>
            )}
          </div>
          <p className="text-xs text-slate-500">JPG or PNG, up to 2&nbsp;MB.</p>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
        </div>
      </div>
      {error && <Alert variant="error">{error}</Alert>}
    </SectionCard>
  );
}

/** Resume upload/remove (PDF) — updates the auth context user directly. */
function ResumeField() {
  const { user, updateCurrentUser } = useAuth();
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      updateCurrentUser(await userApi.uploadResume(file));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };

  const onRemove = async () => {
    setBusy(true);
    setError('');
    try {
      updateCurrentUser(await userApi.removeResume());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SectionCard title="Resume" description="Upload your resume as a PDF (up to 5 MB).">
      <div className="flex flex-wrap items-center gap-3">
        {user.resumeUrl ? (
          <a href={user.resumeUrl} target="_blank" rel="noreferrer noopener">
            <Button type="button" variant="outline" size="sm">
              <FileText className="h-4 w-4" /> View current resume
            </Button>
          </a>
        ) : (
          <span className="text-sm text-slate-500">No resume uploaded yet.</span>
        )}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          loading={busy}
          onClick={() => fileRef.current?.click()}
        >
          {user.resumeUrl ? 'Replace PDF' : 'Upload PDF'}
        </Button>
        {user.resumeUrl && (
          <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={onRemove}>
            Remove
          </Button>
        )}
        <input ref={fileRef} type="file" accept="application/pdf" hidden onChange={onFile} />
      </div>
      {error && <Alert variant="error">{error}</Alert>}
    </SectionCard>
  );
}

export default function EditProfilePage() {
  const { user, updateCurrentUser } = useAuth();
  const [status, setStatus] = useState({ type: '', msg: '' });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: user.name ?? '',
      college: user.college ?? '',
      department: user.department ?? '',
      year: user.year ?? '',
      availability: user.availability ?? 'available',
      workMode: user.workMode ?? 'any',
      bio: user.bio ?? '',
      skills: user.skills ?? [],
      hackathons: user.hackathons ?? [],
      links: {
        github: user.links?.github ?? '',
        linkedin: user.links?.linkedin ?? '',
        portfolio: user.links?.portfolio ?? '',
      },
      projects: user.projects ?? [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'projects' });

  const onSubmit = async (values) => {
    setStatus({ type: '', msg: '' });
    try {
      const payload = {
        ...values,
        projects: values.projects.filter((p) => p.title?.trim()),
      };
      updateCurrentUser(await userApi.updateProfile(payload));
      setStatus({ type: 'success', msg: 'Your profile has been saved.' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setStatus({ type: 'error', msg: getErrorMessage(err) });
    }
  };

  return (
    <Container className="max-w-3xl py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Edit profile</h1>
        <Link to={`/profile/${user.id}`}>
          <Button variant="outline" size="sm">
            View profile
          </Button>
        </Link>
      </div>

      {status.msg && (
        <div className="mb-6">
          <Alert variant={status.type === 'success' ? 'success' : 'error'}>{status.msg}</Alert>
        </div>
      )}

      <AvatarField />

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6" noValidate>
        {/* Basics */}
        <SectionCard title="Basics">
          <Input
            label="Full name"
            error={errors.name?.message}
            {...register('name', {
              required: 'Name is required',
              minLength: { value: 2, message: 'Name must be at least 2 characters' },
            })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="College" placeholder="e.g. MIT" {...register('college')} />
            <Input label="Department" placeholder="e.g. Computer Science" {...register('department')} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Select label="Year" {...register('year')}>
              <option value="">— Select —</option>
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
            <Select label="Availability" options={AVAILABILITY_OPTIONS} {...register('availability')} />
            <Select label="Preferred work mode" options={WORK_MODE_OPTIONS} {...register('workMode')} />
          </div>
          <Textarea
            label="Bio"
            rows={4}
            placeholder="Tell others what you're building and what you're looking for…"
            hint="Up to 600 characters."
            error={errors.bio?.message}
            {...register('bio', { maxLength: { value: 600, message: 'Bio must be at most 600 characters' } })}
          />
        </SectionCard>

        {/* Skills & hackathons */}
        <SectionCard title="Skills & experience">
          <Controller
            control={control}
            name="skills"
            render={({ field }) => (
              <TagInput
                id="skills"
                label="Skills"
                hint="Add up to 30. Press Enter or comma after each."
                placeholder="e.g. React, Python, Figma"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <Controller
            control={control}
            name="hackathons"
            render={({ field }) => (
              <TagInput
                id="hackathons"
                label="Previous hackathons"
                placeholder="e.g. HackMIT 2025"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </SectionCard>

        {/* Links */}
        <SectionCard title="Links" description="Share where people can learn more about you.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="GitHub" placeholder="https://github.com/you" error={errors.links?.github?.message} {...register('links.github')} />
            <Input label="LinkedIn" placeholder="https://linkedin.com/in/you" {...register('links.linkedin')} />
            <Input label="Portfolio" placeholder="https://you.dev" {...register('links.portfolio')} />
          </div>
        </SectionCard>

        {/* Resume (PDF upload) */}
        <ResumeField />

        {/* Projects */}
        <SectionCard title="Projects" description="Highlight things you've built.">
          {fields.length === 0 && <p className="text-sm text-slate-400">No projects yet.</p>}
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">Project {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
                <div className="mt-3 space-y-3">
                  <Input
                    placeholder="Project title"
                    error={errors.projects?.[index]?.title?.message}
                    {...register(`projects.${index}.title`, { required: 'Title is required' })}
                  />
                  <Input placeholder="Link (optional)" {...register(`projects.${index}.url`)} />
                  <Textarea rows={2} placeholder="Short description (optional)" {...register(`projects.${index}.description`)} />
                </div>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ title: '', description: '', url: '' })}
          >
            + Add project
          </Button>
        </SectionCard>

        <div className="flex items-center justify-end gap-3">
          <Link to={`/profile/${user.id}`}>
            <Button variant="ghost" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="submit" size="lg" loading={isSubmitting}>
            Save profile
          </Button>
        </div>
      </form>
    </Container>
  );
}
