import { Droplets, Plus, Minus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export const WaterTracker = () => {
  const [glasses, setGlasses] = useState(5);
  const target = 8;
  const percentage = (glasses / target) * 100;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Su Takibi</h3>
        <Droplets className="w-5 h-5 text-blue-400" />
      </div>

      <div className="flex items-center justify-center gap-1 mb-4">
        {Array.from({ length: target }).map((_, i) => (
          <div
            key={i}
            className={`w-6 h-10 rounded-lg transition-all duration-300 ${
              i < glasses 
                ? "bg-gradient-to-t from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/30" 
                : "bg-border"
            }`}
          />
        ))}
      </div>

      <div className="text-center mb-4">
        <span className="text-3xl font-bold text-foreground">{glasses}</span>
        <span className="text-muted-foreground"> / {target} bardak</span>
      </div>

      <div className="flex items-center justify-center gap-4">
        <Button
          variant="glass"
          size="icon"
          onClick={() => setGlasses(Math.max(0, glasses - 1))}
          disabled={glasses === 0}
        >
          <Minus className="w-4 h-4" />
        </Button>
        <Button
          variant="neon"
          size="icon"
          onClick={() => setGlasses(Math.min(target, glasses + 1))}
          disabled={glasses === target}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="mt-4 h-2 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
