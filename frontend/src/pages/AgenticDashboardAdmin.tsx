import AgenticDashboard from './AgenticDashboard';

const AgenticDashboardAdmin = () => (
  <AgenticDashboard
    expectedRole="admin"
    backPath="/admin"
    backLabel="Admin paneline don"
    title="System Monitoring"
    description="Scheduler, batch akisi, bildirimler ve canli sistem loglari."
  />
);

export default AgenticDashboardAdmin;
