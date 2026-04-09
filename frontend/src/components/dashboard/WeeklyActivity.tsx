const days = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const data = [
  { day: "Pzt", calories: 1850, target: 2000 },
  { day: "Sal", calories: 2100, target: 2000 },
  { day: "Çar", calories: 1750, target: 2000 },
  { day: "Per", calories: 1900, target: 2000 },
  { day: "Cum", calories: 2200, target: 2000 },
  { day: "Cmt", calories: 1600, target: 2000 },
  { day: "Paz", calories: 1400, target: 2000 },
];

export const WeeklyActivity = () => {
  const maxCalories = Math.max(...data.map((d) => d.calories), 2000);

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold text-foreground mb-6">Haftalık Aktivite</h3>

      <div className="flex items-end justify-between gap-2 h-40">
        {data.map((item, index) => {
          const height = (item.calories / maxCalories) * 100;
          const isOverTarget = item.calories > item.target;
          
          return (
            <div key={item.day} className="flex-1 flex flex-col items-center gap-2">
              <div className="relative w-full h-32 flex items-end justify-center">
                {/* Target line */}
                <div 
                  className="absolute w-full border-t border-dashed border-primary/30"
                  style={{ bottom: `${(item.target / maxCalories) * 100}%` }}
                />
                
                {/* Bar */}
                <div
                  className={`w-full max-w-8 rounded-t-lg transition-all duration-500 ${
                    isOverTarget 
                      ? "bg-gradient-to-t from-amber-500 to-orange-400" 
                      : "bg-gradient-to-t from-primary to-accent"
                  }`}
                  style={{ 
                    height: `${height}%`,
                    animationDelay: `${index * 100}ms`,
                    boxShadow: `0 0 10px ${isOverTarget ? "rgba(245, 158, 11, 0.3)" : "hsl(var(--primary) / 0.3)"}`
                  }}
                />
              </div>
              <span className="text-xs text-muted-foreground font-medium">{item.day}</span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-6 mt-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-primary to-accent" />
          <span className="text-muted-foreground">Hedef dahilinde</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-400" />
          <span className="text-muted-foreground">Hedef üstü</span>
        </div>
      </div>
    </div>
  );
};
