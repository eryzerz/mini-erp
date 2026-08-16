import { cloneElement, isValidElement } from "react";
import { Controller } from "react-hook-form";
import type { Control, FieldValues, Path } from "react-hook-form";

import { Label } from "./label";
import { Select, SelectContent, SelectTrigger, SelectValue } from "./select";

export interface FieldHandlers<V> {
  value: V;
  onChange: (value: V | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ref: React.Ref<any>;
  name: string;
}

interface FormFieldProps<T extends FieldValues, V = T[Path<T>]> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  children: (field: FieldHandlers<V>) => React.ReactNode;
  hint?: string;
}

const errorId = (name: string): string => `${name}-error`;

export const FormField = <T extends FieldValues, V = T[Path<T>]>({
  control,
  name,
  label,
  children,
  hint,
}: FormFieldProps<T, V>): React.ReactElement => (
  <Controller
    control={control}
    name={name}
    render={({ field, fieldState }) => {
      const errorMessage = fieldState.error ? String(fieldState.error.message ?? "Invalid value") : undefined;
      const describedBy = errorMessage ? errorId(String(name)) : hint ? `${String(name)}-hint` : undefined;

      const child = children({
        value: field.value as V,
        onChange: (value: V | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
          field.onChange(value as never),
        onBlur: () => field.onBlur(),
        ref: field.ref,
        name: field.name,
      });

      const a11yProps = {
        "aria-invalid": errorMessage ? true : undefined,
        "aria-describedby": describedBy,
      };

      return (
        <div className="space-y-1.5">
          {label ? <Label htmlFor={String(name)}>{label}</Label> : null}
          {isValidElement(child) ? cloneElement(child, a11yProps) : child}
          {hint && !errorMessage ? (
            <p id={`${String(name)}-hint`} className="text-xs text-muted-foreground">
              {hint}
            </p>
          ) : null}
          {errorMessage ? (
            <p id={errorId(String(name))} className="text-xs text-destructive">
              {errorMessage}
            </p>
          ) : null}
        </div>
      );
    }}
  />
);

interface FormSelectFieldProps<T extends FieldValues, V extends string> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  placeholder?: string;
  children: React.ReactNode;
}

/**
 * Form field for a Radix Select. Unlike FormField (which injects aria props
 * onto the child element), the a11y attributes are placed directly on the
 * SelectTrigger — Radix Select.Root renders no DOM of its own.
 */
export const FormSelectField = <T extends FieldValues, V extends string>({
  control,
  name,
  label,
  placeholder,
  children,
}: FormSelectFieldProps<T, V>): React.ReactElement => (
  <Controller
    control={control}
    name={name}
    render={({ field, fieldState }) => {
      const errorMessage = fieldState.error ? String(fieldState.error.message ?? "Invalid value") : undefined;
      return (
        <div className="space-y-1.5">
          {label ? <Label htmlFor={String(name)}>{label}</Label> : null}
          <Select value={field.value as V} onValueChange={(value) => field.onChange(value)}>
            <SelectTrigger
              id={String(name)}
              aria-invalid={errorMessage ? true : undefined}
              aria-describedby={errorMessage ? `${String(name)}-error` : undefined}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>{children}</SelectContent>
          </Select>
          {errorMessage ? (
            <p id={`${String(name)}-error`} className="text-xs text-destructive">
              {errorMessage}
            </p>
          ) : null}
        </div>
      );
    }}
  />
);
