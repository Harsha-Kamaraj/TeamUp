import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Alert, Button, Input, Select, Textarea, TagInput } from '@/components/ui';
import VerifyEmailNotice from '@/components/auth/VerifyEmailNotice';
import { getErrorMessage, needsEmailVerification } from '@/utils/getErrorMessage';
import { POST_TYPES, POST_MODES } from '@/lib/postOptions';

const typeOptions = POST_TYPES.map((t) => ({ value: t.value, label: `${t.emoji} ${t.label}` }));

// Today's date as YYYY-MM-DD, for the deadline min (no past dates).
const todayStr = () => new Date().toISOString().slice(0, 10);

/** Empty defaults for creating a new post. */
export const emptyPostValues = {
  type: 'hackathon',
  customType: '',
  title: '',
  description: '',
  requiredSkills: [],
  membersNeeded: 2,
  mode: 'remote',
  location: '',
  deadline: '',
  tags: [],
  status: 'open',
};

/**
 * PostForm — shared create/edit form. `onSubmit(values)` may throw; the form
 * surfaces the error and manages the loading state.
 */
export default function PostForm({ defaultValues = emptyPostValues, onSubmit, submitLabel = 'Publish', showStatus = false }) {
  const [formError, setFormError] = useState('');
  const {
    register,
    control,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues });

  const isOther = watch('type') === 'other';

  const submit = async (values) => {
    setFormError('');
    try {
      await onSubmit(values);
    } catch (err) {
      setFormError(getErrorMessage(err, 'Could not save the post.'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5" noValidate>
      {formError &&
        (needsEmailVerification(formError) ? (
          <VerifyEmailNotice message={formError} />
        ) : (
          <Alert variant="error">{formError}</Alert>
        ))}

      <div className="grid gap-5 sm:grid-cols-2">
        <Select label="Type" options={typeOptions} {...register('type')} />
        {showStatus && (
          <Select
            label="Status"
            options={[
              { value: 'open', label: 'Open — accepting teammates' },
              { value: 'closed', label: 'Closed' },
            ]}
            {...register('status')}
          />
        )}
      </div>

      {isOther && (
        <Input
          label="What kind of event? ✨"
          placeholder="e.g. DJ Nite, Cultural Fest, Study Group"
          error={errors.customType?.message}
          {...register('customType', {
            required: 'Tell us what kind of event this is',
            maxLength: { value: 40, message: 'Keep it under 40 characters' },
          })}
        />
      )}

      <Input
        label="Title"
        placeholder="e.g. Looking for a frontend dev for HackMIT"
        error={errors.title?.message}
        {...register('title', {
          required: 'Title is required',
          minLength: { value: 5, message: 'Title must be at least 5 characters' },
        })}
      />

      <Textarea
        label="Description"
        rows={6}
        placeholder="Describe what you're building, the event, and who you're looking for…"
        error={errors.description?.message}
        {...register('description', {
          required: 'Description is required',
          minLength: { value: 20, message: 'Description must be at least 20 characters' },
        })}
      />

      <Controller
        control={control}
        name="requiredSkills"
        render={({ field }) => (
          <TagInput
            id="requiredSkills"
            label="Required skills"
            placeholder="e.g. React, ML, Figma"
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />

      <div className="grid gap-5 sm:grid-cols-3">
        <Input
          label="Members needed"
          type="number"
          min={1}
          max={50}
          error={errors.membersNeeded?.message}
          {...register('membersNeeded', {
            valueAsNumber: true,
            required: 'Required',
            min: { value: 1, message: 'At least 1' },
            max: { value: 50, message: 'At most 50' },
          })}
        />
        <Select label="Work mode" options={POST_MODES} {...register('mode')} />
        <Input
          label="Deadline"
          type="date"
          min={todayStr()}
          error={errors.deadline?.message}
          {...register('deadline', {
            validate: (v) => !v || v >= todayStr() || 'Deadline cannot be in the past',
          })}
        />
      </div>

      <Input
        label="Location"
        placeholder="e.g. Boston, MA (for in-person / hybrid)"
        {...register('location')}
      />

      <Controller
        control={control}
        name="tags"
        render={({ field }) => (
          <TagInput
            id="tags"
            label="Tags"
            hint="Help others find this — e.g. ai, web, fintech"
            placeholder="Add a tag"
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />

      <div className="flex justify-end">
        <Button type="submit" size="lg" loading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
