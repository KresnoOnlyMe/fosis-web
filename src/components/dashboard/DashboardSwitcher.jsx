import React from "react";
import { Grid2X2, BarChart3 } from "lucide-react";

export default function DashboardSwitcher({
  mode,
  setMode
}) {
  return (
    <div className="dashboard-switcher">
      <button
        className={mode === "EXECUTIVE" ? "active" : ""}
        onClick={() => setMode("EXECUTIVE")}
      >
        <Grid2X2 size={15} />
        Executive Overview
      </button>

      <button
        className={mode === "ENGINEER" ? "active" : ""}
        onClick={() => setMode("ENGINEER")}
      >
        <BarChart3 size={15} />
        Engineer KPI Performance
      </button>
    </div>
  );
}
