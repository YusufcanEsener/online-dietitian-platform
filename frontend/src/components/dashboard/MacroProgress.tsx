interface MacroData {
  name: string;
  current: number;
  target: number;
  color: string;
  unit: string;
}

const macros: MacroData[] = [
  { name: "Protein", current: 85, target: 120, color: "from-emerald-400 to-green-500", unit: "g" },
  { name: "Karbonhidrat", current: 180, target: 250, color: "from-amber-400 to-orange-500", unit: "g" },
  { name: "Yağ", current: 45, target: 65, color: "from-rose-400 to-pink-500", unit: "g" },
];

export const MacroProgress = () => {
  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold text-foreground mb-6">Makro Besinler</h3>
      
      <div className="space-y-5">
        {macros.map((macro) => {
          const percentage = Math.min((macro.current / macro.target) * 100, 100);
          
          return (
            <div key={macro.name}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-foreground">{macro.name}</span>
                <span className="text-sm text-muted-foreground">
                  {macro.current} / {macro.target} {macro.unit}
                </span>
              </div>
              <div className="h-3 bg-border rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${macro.color} rounded-full transition-all duration-1000 ease-out`}
                  style={{ 
                    width: `${percentage}%`,
                    boxShadow: percentage > 0 ? "0 0 10px currentColor" : "none"
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
