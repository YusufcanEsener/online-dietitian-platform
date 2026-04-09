import { Calendar, Clock, Video, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export const UpcomingAppointment = () => {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Yaklaşan Randevu</h3>
        <Calendar className="w-5 h-5 text-primary" />
      </div>

      <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-lg">
          ES
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground">Dr. Elif Şahin</p>
          <p className="text-sm text-muted-foreground">Klinik Diyetisyen</p>
          
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>Yarın</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>14:00</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <Button variant="neon" className="flex-1">
          <Video className="w-4 h-4" />
          Görüşmeye Katıl
        </Button>
        <Button variant="glass" size="icon">
          <MessageSquare className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
