import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const DashboardPage = () => {
  const navigate = useNavigate();
  // Prevent using browser back button
  useEffect(() => {
    const pushState = () =>
      window.history.pushState(null, "", window.location.href);
    pushState();
    window.addEventListener("popstate", pushState);
    return () => window.removeEventListener("popstate", pushState);
  }, []);

  // Card items with their navigation targets
  const cards = [
    {
      title: "Registered Voters",
      count: "12,345",
      icon: "ballot",
      color: "blue",
      to: "/voter-details",
    },
    {
      title: "Booth Workers",
      count: "1,234",
      icon: "people",
      color: "green",
      to: "/booth-workers",
    },
    {
      title: "Upcoming Events",
      count: "56",
      icon: "event",
      color: "purple",
      // Assumption: Route not defined yet; directing to Reports dashboard as a placeholder
      to: "/reports",
    },
    {
      title: "Active Surveys",
      count: "23",
      icon: "campaign",
      color: "orange",
      to: "/survey-dashboard",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {cards.map(({ title, count, icon, color, to }, i) => (
        <div
          key={i}
          className={`relative group bg-[var(--bg-card)] p-6 rounded-xl shadow-sm border border-slate-200 flex items-center`}
        >
          <div className={`bg-${color}-100 p-4 rounded-full`}>
            <span
              className={`material-icons-outlined text-${color}-600 text-3xl`}
            >
              {icon}
            </span>
          </div>
          <div className="ml-5">
            <h5 className="text-[var(--text-secondary)]">{title}</h5>
            <h3 className="text-2xl font-bold text-[var(--text-primary)]">
              {count}
            </h3>
          </div>

          {/* Hover-only navigation arrow in bottom-right */}
          <button
            type="button"
            aria-label={`Go to ${title}`}
            onClick={() => navigate(to)}
            className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-transparent p-0 m-0"
          >
            <span className="material-icons-outlined text-xl leading-none">
              arrow_forward
            </span>
          </button>
        </div>
      ))}
    </div>
  );
};

export default DashboardPage;
