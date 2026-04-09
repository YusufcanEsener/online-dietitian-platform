interface CalorieRingProps {
  consumed: number;
  target: number;
}

export const CalorieRing = ({ consumed, target }: CalorieRingProps) => {
  const percentage = Math.min((consumed / target) * 100, 100);
  const circumference = 2 * Math.PI * 80;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Günlük Kalori</h3>
      
      <div className="relative flex items-center justify-center">
        <svg className="w-48 h-48 transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="96"
            cy="96"
            r="80"
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="12"
          />
          {/* Progress circle */}
          <circle
            cx="96"
            cy="96"
            r="80"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
            style={{
              filter: "drop-shadow(0 0 10px hsl(var(--primary) / 0.5))",
            }}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(107 81% 50%)" />
              <stop offset="100%" stopColor="hsl(140 70% 40%)" />
            </linearGradient>
          </defs>
        </svg>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold gradient-text">{consumed}</span>
          <span className="text-sm text-muted-foreground">/ {target} kcal</span>
        </div>
      </div>

      <div className="mt-4 flex justify-between text-sm">
        <div className="text-center">
          <p className="text-muted-foreground">Kalan</p>
          <p className="font-semibold text-primary">{target - consumed} kcal</p>
        </div>
        <div className="text-center">
          <p className="text-muted-foreground">Hedef</p>
          <p className="font-semibold text-foreground">{target} kcal</p>
        </div>
      </div>
    </div>
  );
};
