import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl border border-white/70 bg-white/85 shadow-sm backdrop-blur-xl", className)}>
      {children}
    </section>
  );
}

export function Button({
  children,
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  const variants = {
    primary: "bg-klein text-white hover:bg-[#002783]",
    secondary: "border border-gray-200 bg-white text-gray-800 hover:border-klein/40 hover:text-klein",
    ghost: "text-gray-600 hover:bg-gray-100",
    danger: "border border-red-100 bg-red-50 text-red-700 hover:bg-red-100",
  };

  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-klein focus:ring-4 focus:ring-klein/10", className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn("h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-klein focus:ring-4 focus:ring-klein/10", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("min-h-24 w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm leading-6 outline-none transition focus:border-klein focus:ring-4 focus:ring-klein/10", className)} {...props} />;
}

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-gray-100", className)}>
      <div className="h-full rounded-full bg-klein transition-all" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
