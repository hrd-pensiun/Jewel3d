type Step = 1 | 2 | 3;

type StepProgressProps = {
  currentStep: Step;
};

const STEPS = [
  { id: 1 as const, label: "Info" },
  { id: 2 as const, label: "Upload" },
  { id: 3 as const, label: "Result" },
];

export default function StepProgress({ currentStep }: StepProgressProps) {
  return (
    <div className="border-b border-wit-border bg-white py-4">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 sm:max-w-lg">
        {STEPS.map((step, index) => {
          const isActive = step.id === currentStep;
          const isPast = step.id < currentStep;

          return (
            <div key={step.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    isActive || isPast
                      ? "wit-gradient-gold text-white shadow-sm"
                      : "border-2 border-wit-border bg-white text-wit-muted"
                  }`}
                >
                  {step.id}
                </div>
                <span
                  className={`text-xs font-medium ${
                    isActive ? "text-wit-navy" : "text-wit-muted"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`mx-2 mb-5 h-0.5 flex-1 ${
                    isPast ? "bg-wit-gold" : "bg-wit-border"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
