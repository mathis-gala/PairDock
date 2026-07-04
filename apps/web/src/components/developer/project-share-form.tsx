import { useForm } from '@tanstack/react-form';
import { Button } from '../button.js';
import { TextInput } from '../text-input.js';

interface ProjectShareFormProps {
  disabled?: boolean;
  isSubmitting: boolean;
  onShare: (pmEmail: string) => Promise<void>;
}

export function ProjectShareForm({ disabled = false, isSubmitting, onShare }: ProjectShareFormProps) {
  const form = useForm({
    defaultValues: {
      pmEmail: '',
    },
    onSubmit: async ({ value }) => {
      await onShare(value.pmEmail);
      form.reset();
    },
  });

  return (
    <form
      className="flex flex-col gap-2 sm:flex-row"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <form.Field name="pmEmail">
        {(field) => (
          <TextInput
            aria-label="PM email"
            disabled={disabled || isSubmitting}
            name={field.name}
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
            placeholder="pm@example.com"
            required
            type="email"
            value={field.state.value}
          />
        )}
      </form.Field>
      <Button disabled={disabled || isSubmitting} type="submit" variant="secondary">
        {isSubmitting ? 'Sharing…' : 'Share'}
      </Button>
    </form>
  );
}
