import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utills';

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    return (
      <div className="flex items-center">
        <input
          type="checkbox"
          id={id}
          ref={ref}
          className={cn(
            'h-4 w-4 rounded border-gray-300 text-primary',
            'focus:ring-2 focus:ring-primary focus:ring-offset-2',
            'cursor-pointer transition-colors duration-200',
            className
          )}
          {...props}
        />
        {label && (
          <label
            htmlFor={id}
            className="ml-2 block text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };
