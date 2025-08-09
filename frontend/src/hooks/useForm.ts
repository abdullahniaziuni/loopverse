import { useState, useCallback, useEffect } from 'react';

// Form validation rules
export interface ValidationRule<T = any> {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
  custom?: (value: T) => string | null;
  email?: boolean;
  url?: boolean;
  phone?: boolean;
  match?: string; // field name to match
}

export interface ValidationRules<T> {
  [K in keyof T]?: ValidationRule<T[K]>;
}

export interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
}

export interface UseFormOptions<T> {
  initialValues: T;
  validationRules?: ValidationRules<T>;
  onSubmit?: (values: T) => Promise<void> | void;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

// Validation functions
const validateField = <T>(
  value: any,
  rule: ValidationRule<T>,
  allValues: any,
  fieldName: string
): string | null => {
  // Required validation
  if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
    return `${fieldName} is required`;
  }

  // Skip other validations if value is empty and not required
  if (!value && !rule.required) {
    return null;
  }

  // String validations
  if (typeof value === 'string') {
    if (rule.minLength && value.length < rule.minLength) {
      return `${fieldName} must be at least ${rule.minLength} characters`;
    }

    if (rule.maxLength && value.length > rule.maxLength) {
      return `${fieldName} must be no more than ${rule.maxLength} characters`;
    }

    if (rule.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return `${fieldName} must be a valid email address`;
    }

    if (rule.url && !/^https?:\/\/.+/.test(value)) {
      return `${fieldName} must be a valid URL`;
    }

    if (rule.phone && !/^\+?[\d\s\-\(\)]+$/.test(value)) {
      return `${fieldName} must be a valid phone number`;
    }

    if (rule.pattern && !rule.pattern.test(value)) {
      return `${fieldName} format is invalid`;
    }
  }

  // Number validations
  if (typeof value === 'number') {
    if (rule.min !== undefined && value < rule.min) {
      return `${fieldName} must be at least ${rule.min}`;
    }

    if (rule.max !== undefined && value > rule.max) {
      return `${fieldName} must be no more than ${rule.max}`;
    }
  }

  // Match validation (for password confirmation, etc.)
  if (rule.match && allValues[rule.match] !== value) {
    return `${fieldName} must match ${rule.match}`;
  }

  // Custom validation
  if (rule.custom) {
    return rule.custom(value);
  }

  return null;
};

export function useForm<T extends Record<string, any>>({
  initialValues,
  validationRules = {},
  onSubmit,
  validateOnChange = true,
  validateOnBlur = true,
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate derived state
  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);
  const isValid = Object.keys(errors).length === 0;

  // Validate a single field
  const validateField = useCallback(
    (fieldName: keyof T, value: any): string | null => {
      const rule = validationRules[fieldName];
      if (!rule) return null;

      return validateField(value, rule, values, String(fieldName));
    },
    [validationRules, values]
  );

  // Validate all fields
  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};

    Object.keys(validationRules).forEach((fieldName) => {
      const error = validateField(fieldName as keyof T, values[fieldName]);
      if (error) {
        newErrors[fieldName as keyof T] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [validationRules, values, validateField]);

  // Set field value
  const setValue = useCallback(
    (fieldName: keyof T, value: any) => {
      setValues((prev) => ({ ...prev, [fieldName]: value }));

      if (validateOnChange) {
        const error = validateField(fieldName, value);
        setErrors((prev) => ({
          ...prev,
          [fieldName]: error || undefined,
        }));
      }
    },
    [validateOnChange, validateField]
  );

  // Set multiple values
  const setValues = useCallback((newValues: Partial<T>) => {
    setValues((prev) => ({ ...prev, ...newValues }));

    if (validateOnChange) {
      const newErrors = { ...errors };
      Object.entries(newValues).forEach(([fieldName, value]) => {
        const error = validateField(fieldName as keyof T, value);
        if (error) {
          newErrors[fieldName as keyof T] = error;
        } else {
          delete newErrors[fieldName as keyof T];
        }
      });
      setErrors(newErrors);
    }
  }, [validateOnChange, validateField, errors]);

  // Handle field blur
  const handleBlur = useCallback(
    (fieldName: keyof T) => {
      setTouched((prev) => ({ ...prev, [fieldName]: true }));

      if (validateOnBlur) {
        const error = validateField(fieldName, values[fieldName]);
        setErrors((prev) => ({
          ...prev,
          [fieldName]: error || undefined,
        }));
      }
    },
    [validateOnBlur, validateField, values]
  );

  // Handle form submission
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      // Mark all fields as touched
      const allTouched = Object.keys(values).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {}
      );
      setTouched(allTouched);

      // Validate form
      const isFormValid = validateForm();
      if (!isFormValid || !onSubmit) {
        return;
      }

      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validateForm, onSubmit]
  );

  // Reset form
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  // Set form errors (useful for server-side validation)
  const setFormErrors = useCallback((newErrors: Partial<Record<keyof T, string>>) => {
    setErrors(newErrors);
  }, []);

  // Get field props for easy integration with form inputs
  const getFieldProps = useCallback(
    (fieldName: keyof T) => ({
      name: String(fieldName),
      value: values[fieldName] || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setValue(fieldName, e.target.value);
      },
      onBlur: () => handleBlur(fieldName),
      error: touched[fieldName] ? errors[fieldName] : undefined,
    }),
    [values, errors, touched, setValue, handleBlur]
  );

  // Get checkbox props
  const getCheckboxProps = useCallback(
    (fieldName: keyof T) => ({
      name: String(fieldName),
      checked: Boolean(values[fieldName]),
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(fieldName, e.target.checked);
      },
      onBlur: () => handleBlur(fieldName),
      error: touched[fieldName] ? errors[fieldName] : undefined,
    }),
    [values, errors, touched, setValue, handleBlur]
  );

  // Get select props
  const getSelectProps = useCallback(
    (fieldName: keyof T) => ({
      name: String(fieldName),
      value: values[fieldName] || '',
      onChange: (value: any) => {
        setValue(fieldName, value);
      },
      onBlur: () => handleBlur(fieldName),
      error: touched[fieldName] ? errors[fieldName] : undefined,
    }),
    [values, errors, touched, setValue, handleBlur]
  );

  return {
    // State
    values,
    errors,
    touched,
    isValid,
    isDirty,
    isSubmitting,

    // Actions
    setValue,
    setValues,
    handleBlur,
    handleSubmit,
    reset,
    setFormErrors,
    validateForm,

    // Helper functions
    getFieldProps,
    getCheckboxProps,
    getSelectProps,
  };
}

// Predefined validation rules for common use cases
export const commonValidationRules = {
  email: {
    required: true,
    email: true,
  },
  password: {
    required: true,
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
  },
  confirmPassword: (passwordField: string) => ({
    required: true,
    match: passwordField,
  }),
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
  },
  phone: {
    phone: true,
  },
  url: {
    url: true,
  },
  rating: {
    required: true,
    min: 1,
    max: 5,
  },
  hourlyRate: {
    required: true,
    min: 0,
    max: 1000,
  },
};

// Form field component wrapper
export interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  required,
  children,
  className = '',
}) => {
  return (
    <div className={`form-field ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};
