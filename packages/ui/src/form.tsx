import { Controller } from "react-hook-form";
import type { Control, FieldValues, Path } from "react-hook-form";

import { Label } from "./label";

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
      return (
        <div className="space-y-1.5">
          {label ? <Label htmlFor={String(name)}>{label}</Label> : null}
          {children({
            value: field.value as V,
            onChange: (value: V | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
              field.onChange(value as never),
            onBlur: () => field.onBlur(),
            ref: field.ref,
            name: field.name,
          })}
          {hint && !errorMessage ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
          {errorMessage ? <p className="text-xs text-destructive">{errorMessage}</p> : null}
        </div>
      );
    }}
  />
);
