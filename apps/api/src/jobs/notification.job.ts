import cron from 'node-cron';
import { checkUpcomingInstallments, checkBudgetAlerts } from '../services/notifications.service';

export function startNotificationJobs(): void {
  // Run daily at 8:00 AM Lima time
  cron.schedule(
    '0 8 * * *',
    async () => {
      console.log('[Cron] Running notification jobs...');

      await checkUpcomingInstallments().catch((err) => {
        console.error('[Cron] checkUpcomingInstallments failed:', err);
      });

      await checkBudgetAlerts().catch((err) => {
        console.error('[Cron] checkBudgetAlerts failed:', err);
      });

      console.log('[Cron] Notification jobs completed.');
    },
    { timezone: 'America/Lima' }
  );

  console.log('[Cron] Notification jobs scheduled (8:00 AM Lima time).');
}
