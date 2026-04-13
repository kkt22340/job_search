import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
};

export function BigButton({
  children,
  className = "",
  variant = "primary",
  type = "button",
  ...rest
}: Props) {
  const base =
    "flex min-h-[60px] w-full items-center justify-center gap-2 rounded-2xl px-5 text-[18px] font-semibold transition-colors active:opacity-90 disabled:opacity-40";
  const styles = {
    primary: "bg-zinc-900 text-white",
    secondary: "border-2 border-zinc-300 bg-white text-zinc-900",
    ghost: "bg-transparent text-zinc-700 underline-offset-4 hover:underline",
  }[variant];

  return (
    <button type={type} className={`${base} ${styles} ${className}`} {...rest}>
      {children}
    </button>
  );
}
