import type { ButtonHTMLAttributes, ReactNode } from "react";

/** `<a>` 등에 동일한 터치 영역·스타일을 맞출 때 사용 */
export const bigButtonClassNames = {
  base: "flex min-h-[60px] w-full items-center justify-center gap-2 rounded-2xl px-5 text-[18px] font-semibold transition-colors active:opacity-90 disabled:opacity-40",
  primary: "bg-zinc-900 text-white",
  secondary: "border-2 border-zinc-300 bg-white text-zinc-900",
  ghost: "bg-transparent text-zinc-700 underline-offset-4 hover:underline",
} as const;

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
  const styles = bigButtonClassNames[variant];

  return (
    <button
      type={type}
      className={`${bigButtonClassNames.base} ${styles} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
