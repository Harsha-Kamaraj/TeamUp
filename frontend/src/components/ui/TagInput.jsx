import { useState } from 'react';
import { cn } from '@/utils/cn';

/**
 * TagInput — controlled multi-value input for skills/tags.
 * Props: value (string[]), onChange (string[]) → void.
 * Add a tag with Enter or comma; remove with the ✕ or Backspace on an
 * empty field. Designed to plug into React Hook Form via <Controller>.
 */
export default function TagInput({
  value = [],
  onChange,
  label,
  hint,
  placeholder = 'Type and press Enter',
  max = 30,
  maxLength = 40,
  id,
}) {
  const [draft, setDraft] = useState('');

  const addTag = (raw) => {
    const tag = raw.trim().slice(0, maxLength);
    if (!tag) return;
    if (value.length >= max) return;
    // case-insensitive de-dupe
    if (value.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      setDraft('');
      return;
    }
    onChange([...value, tag]);
    setDraft('');
  };

  const removeTag = (index) => onChange(value.filter((_, i) => i !== index));

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(draft);
    } else if (e.key === 'Backspace' && !draft && value.length) {
      removeTag(value.length - 1);
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <div
        className={cn(
          'flex flex-wrap items-center gap-2 rounded-xl border border-slate-300 bg-white px-2.5 py-2 shadow-sm',
          'focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100'
        )}
      >
        {value.map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(i)}
              className="text-brand-400 hover:text-brand-700"
              aria-label={`Remove ${tag}`}
            >
              ✕
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => addTag(draft)}
          placeholder={value.length === 0 ? placeholder : ''}
          className="min-w-[8rem] flex-1 border-0 bg-transparent py-1 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
      </div>
      {hint && <p className="mt-1.5 text-sm text-slate-500">{hint}</p>}
    </div>
  );
}
