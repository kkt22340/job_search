type Props = {
  step: number;
  total: number;
  title: string;
  description?: string;
};

export function StepHeader({ step, total, title, description }: Props) {
  return (
    <div className="mb-6">
      <p className="text-[15px] font-medium text-zinc-500">
        {step} / {total} 단계
      </p>
      <h2 className="mt-1 text-[22px] font-semibold tracking-tight text-zinc-900">
        {title}
      </h2>
      {description ? (
        <p className="mt-2 text-[17px] leading-relaxed text-zinc-600">
          {description}
        </p>
      ) : null}
    </div>
  );
}
