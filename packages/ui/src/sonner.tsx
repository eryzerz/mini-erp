import { Toaster as SonnerToaster } from "sonner";

export const Toaster = (): React.ReactElement => (
  <SonnerToaster
    position="top-right"
    toastOptions={{
      classNames: {
        toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:shadow-lg",
      },
    }}
  />
);
