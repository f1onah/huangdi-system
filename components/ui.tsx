import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        "rounded-glass border border-white/[0.08] bg-white/[0.05] shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:border-klein/45 hover:shadow-glow",
        className,
      )}
    >
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
    primary: "border border-klein/70 bg-klein text-white shadow-[0_0_24px_rgba(0,47,167,0.42)] hover:border-white/20 hover:bg-[#0642d8] hover:shadow-[0_0_34px_rgba(0,47,167,0.62)]",
    secondary: "border border-white/[0.1] bg-white/[0.06] text-white/80 hover:border-klein/50 hover:bg-klein/20 hover:text-white",
    ghost: "text-white/65 hover:bg-white/[0.06] hover:text-white",
    danger: "border border-[#FF4D4F]/25 bg-[#FF4D4F]/10 text-[#FF8A8B] hover:bg-[#FF4D4F]/18 hover:text-white",
  };

  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-center text-sm font-medium leading-tight transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50",
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
  return <input className={cn("h-11 w-full rounded-xl border border-white/[0.1] bg-white/[0.06] px-3 text-sm text-white outline-none transition-all duration-300 placeholder:text-white/35 focus:border-klein/70 focus:bg-white/[0.08] focus:ring-4 focus:ring-klein/20", className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn("h-11 w-full rounded-xl border border-white/[0.1] bg-[#111827] px-3 text-sm text-white outline-none transition-all duration-300 focus:border-klein/70 focus:ring-4 focus:ring-klein/20", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("min-h-28 w-full resize-none rounded-xl border border-white/[0.1] bg-white/[0.06] px-3 py-3 text-sm leading-6 text-white outline-none transition-all duration-300 placeholder:text-white/35 focus:border-klein/70 focus:bg-white/[0.08] focus:ring-4 focus:ring-klein/20", className)} {...props} />;
}

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-white/[0.08]", className)}>
      <div className="h-full rounded-full bg-gradient-to-r from-klein via-[#2F6BFF] to-[#00C896] shadow-[0_0_20px_rgba(0,47,167,0.8)] transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
