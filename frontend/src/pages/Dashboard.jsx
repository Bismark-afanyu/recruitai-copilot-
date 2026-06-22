import { useEffect, useState } from "react";
import { api } from "../api.js";
import StatCards from "../components/dashboard/StatCards.jsx";
import OpenPositionChart from "../components/dashboard/OpenPositionChart.jsx";
import OverviewChart from "../components/dashboard/OverviewChart.jsx";
import DailyTaskTable from "../components/dashboard/DailyTaskTable.jsx";
import SchedulePanel from "../components/dashboard/SchedulePanel.jsx";
import ActivityFeed from "../components/dashboard/ActivityFeed.jsx";
import TeamPerformance from "../components/dashboard/TeamPerformance.jsx";
import QuickActions from "../components/dashboard/QuickActions.jsx";
import LoadingSkeleton from "../components/ui/LoadingSkeleton.jsx";
import showToast from "../components/ui/Toast.jsx";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.dashboard().then(setData).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      showToast.info("New application received from Sarah Chen!", {
        duration: 5000,
      });
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (error) {
    return (
      <div className="px-4 py-3 rounded-lg bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 text-sm text-rose-700 dark:text-rose-300">
        {error}
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-80px)]">
      <div className="flex-1 min-w-0 overflow-y-auto pr-2 space-y-6 scrollbar-thin">
        <StatCards />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OpenPositionChart />
          <OverviewChart />
        </div>

        <DailyTaskTable />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ActivityFeed />
          <TeamPerformance />
        </div>
      </div>

      <div className="hidden xl:block w-80 flex-shrink-0 overflow-y-auto pl-2 scrollbar-thin">
        <SchedulePanel />
      </div>

      <QuickActions />
    </div>
  );
}
