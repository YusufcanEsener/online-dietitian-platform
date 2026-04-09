import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TrendingDown, TrendingUp, Target, Calendar, Scale, Ruler } from "lucide-react";

const weightHistory = [
  { date: "1 Oca", weight: 85.0 },
  { date: "8 Oca", weight: 84.2 },
  { date: "15 Oca", weight: 83.5 },
  { date: "22 Oca", weight: 83.0 },
  { date: "29 Oca", weight: 82.3 },
  { date: "5 Şub", weight: 81.8 },
  { date: "12 Şub", weight: 81.2 },
  { date: "19 Şub", weight: 80.5 },
];

const stats = [
  { label: "Başlangıç", value: "85.0 kg", icon: Scale, color: "text-muted-foreground" },
  { label: "Güncel", value: "80.5 kg", icon: Scale, color: "text-primary" },
  { label: "Hedef", value: "75.0 kg", icon: Target, color: "text-accent" },
  { label: "Verilen", value: "4.5 kg", icon: TrendingDown, color: "text-green-400" },
];

const Progress = () => {
  const maxWeight = Math.max(...weightHistory.map((w) => w.weight));
  const minWeight = Math.min(...weightHistory.map((w) => w.weight));
  const range = maxWeight - minWeight;
  
  const startWeight = 85;
  const currentWeight = 80.5;
  const targetWeight = 75;
  const totalToLose = startWeight - targetWeight;
  const lost = startWeight - currentWeight;
  const progressPercentage = (lost / totalToLose) * 100;

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
            Kilo <span className="gradient-text">İlerlemesi</span>
          </h1>
          <p className="text-muted-foreground">Hedefinize doğru ilerlemenizi takip edin</p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="glass-card p-4 lg:p-6">
              <div className="flex items-center gap-3 mb-2">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-2xl lg:text-3xl font-bold text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="glass-card p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Toplam İlerleme</h3>
            <span className="text-2xl font-bold gradient-text">{progressPercentage.toFixed(0)}%</span>
          </div>
          
          <div className="relative h-6 bg-border rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-neon-gradient rounded-full transition-all duration-1000"
              style={{ width: `${progressPercentage}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
          </div>
          
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            <span>{startWeight} kg</span>
            <span>Hedef: {targetWeight} kg</span>
          </div>
        </div>

        {/* Weight Chart */}
        <div className="glass-card p-6 mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-6">Kilo Değişim Grafiği</h3>
          
          <div className="relative h-64">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-muted-foreground">
              <span>{maxWeight} kg</span>
              <span>{((maxWeight + minWeight) / 2).toFixed(1)} kg</span>
              <span>{minWeight} kg</span>
            </div>
            
            {/* Chart area */}
            <div className="absolute left-14 right-0 top-0 bottom-8">
              <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                {/* Grid lines */}
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="hsl(107 81% 50%)" />
                    <stop offset="100%" stopColor="hsl(140 70% 40%)" />
                  </linearGradient>
                  <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="hsl(107 81% 50%)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="hsl(107 81% 50%)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                
                {/* Area */}
                <path
                  d={`M 0 ${200 - ((weightHistory[0].weight - minWeight) / range) * 180} 
                      ${weightHistory.map((w, i) => 
                        `L ${(i / (weightHistory.length - 1)) * 400} ${200 - ((w.weight - minWeight) / range) * 180}`
                      ).join(' ')} 
                      L 400 200 L 0 200 Z`}
                  fill="url(#areaGradient)"
                />
                
                {/* Line */}
                <path
                  d={`M ${weightHistory.map((w, i) => 
                      `${(i / (weightHistory.length - 1)) * 400} ${200 - ((w.weight - minWeight) / range) * 180}`
                    ).join(' L ')}`}
                  fill="none"
                  stroke="url(#lineGradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ filter: "drop-shadow(0 0 6px hsl(107 81% 50% / 0.5))" }}
                />
                
                {/* Points */}
                {weightHistory.map((w, i) => (
                  <circle
                    key={i}
                    cx={(i / (weightHistory.length - 1)) * 400}
                    cy={200 - ((w.weight - minWeight) / range) * 180}
                    r="6"
                    fill="hsl(var(--card))"
                    stroke="hsl(107 81% 50%)"
                    strokeWidth="2"
                  />
                ))}
              </svg>
            </div>
            
            {/* X-axis labels */}
            <div className="absolute left-14 right-0 bottom-0 flex justify-between text-xs text-muted-foreground">
              {weightHistory.filter((_, i) => i % 2 === 0).map((w) => (
                <span key={w.date}>{w.date}</span>
              ))}
            </div>
          </div>
        </div>

        {/* History */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Kilo Geçmişi</h3>
          
          <div className="space-y-3">
            {[...weightHistory].reverse().map((entry, index) => {
              const prevWeight = weightHistory[weightHistory.length - 1 - index - 1]?.weight;
              const change = prevWeight ? entry.weight - prevWeight : 0;
              
              return (
                <div key={entry.date} className="flex items-center justify-between p-3 rounded-xl bg-surface hover:bg-surface-elevated transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{entry.date} 2024</p>
                      <p className="text-sm text-muted-foreground">Haftalık ölçüm</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">{entry.weight} kg</p>
                    {change !== 0 && (
                      <p className={`text-sm flex items-center gap-1 ${change < 0 ? "text-green-400" : "text-red-400"}`}>
                        {change < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                        {Math.abs(change).toFixed(1)} kg
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Progress;
