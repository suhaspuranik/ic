import { useMemo, useState } from "react";

const sampleIssues = [
  {
    id: "ISS-1001",
    raisedBy: "John Doe",
    department: "Sanitation",
    status: "Open",
    summary: "Garbage not collected in Ward 5",
    description:
      "Residents reported that garbage has not been collected for the past three days in multiple streets of Ward 5. There is a foul smell and stray animals are scattering the waste.",
    media: [
      "https://via.placeholder.com/160x100?text=Photo+1",
      "https://via.placeholder.com/160x100?text=Photo+2",
    ],
    createdAt: "2025-08-30",
  },
  {
    id: "ISS-1002",
    raisedBy: "Aisha Khan",
    department: "Water Supply",
    status: "In Progress",
    summary: "Low water pressure in Block C",
    description:
      "Block C residents are experiencing very low water pressure during peak hours. This has been ongoing for a week and affects daily activities.",
    media: ["https://via.placeholder.com/160x100?text=Photo+3"],
    createdAt: "2025-08-31",
  },
  {
    id: "ISS-1003",
    raisedBy: "Ravi Kumar",
    department: "Roads & Transport",
    status: "Open",
    summary: "Potholes on Main Street",
    description:
      "Multiple potholes have appeared on Main Street after recent rains. They pose a risk to two-wheelers and need urgent repair.",
    media: [],
    createdAt: "2025-09-01",
  },
];

const allDepartments = [
  "Sanitation",
  "Water Supply",
  "Roads & Transport",
  "Electricity",
  "Parks & Recreation",
];

const allStatuses = ["Open", "In Progress", "Resolved", "Closed"];

const IssuesPage = () => {
  const [issues, setIssues] = useState(sampleIssues);
  const [expanded, setExpanded] = useState(new Set());
  const [filters, setFilters] = useState({
    search: "",
    department: "",
    status: "",
  });

  const toggleExpand = (id) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpanded(next);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => setFilters({ search: "", department: "", status: "" });

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (filters.search) {
        const s = filters.search.toLowerCase();
        const hay = `${issue.id} ${issue.raisedBy} ${issue.summary} ${issue.description}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      if (filters.department && issue.department !== filters.department) return false;
      if (filters.status && issue.status !== filters.status) return false;
      return true;
    });
  }, [issues, filters]);

  const updateDepartment = (id, department) => {
    setIssues((prev) => prev.map((it) => (it.id === id ? { ...it, department } : it)));
  };

  const markResolved = (id) => {
    setIssues((prev) => prev.map((it) => (it.id === id ? { ...it, status: "Resolved" } : it)));
  };

  return (
    <div className="pt-0 px-8">
      {/* Filters */}
      <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Search</label>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search issues..."
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Department</label>
            <select
              name="department"
              value={filters.department}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
            >
              <option value="">All</option>
              {allDepartments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
            >
              <option value="">All</option>
              {allStatuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors w-full"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Issues Table */}
      <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Issue ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Raised By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredIssues.map((issue) => (
                <>
                  <tr
                    key={issue.id}
                    onClick={() => toggleExpand(issue.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") toggleExpand(issue.id);
                    }}
                    tabIndex={0}
                    role="button"
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--text-primary)]">{issue.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">{issue.raisedBy}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">{issue.summary}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {issue.department}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={(e) => { e.stopPropagation(); markResolved(issue.id); }}
                        className="text-green-600 hover:text-green-800"
                      >
                        Mark Resolved
                      </button>
                    </td>
                  </tr>
                  {expanded.has(issue.id) && (
                    <tr key={`${issue.id}-details`} className="bg-gray-50">
                      <td colSpan={5} className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="md:col-span-2">
                            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Description</h4>
                            <p className="text-sm text-[var(--text-secondary)] mb-4">{issue.description}</p>
                            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Media</h4>
                            {issue.media.length === 0 ? (
                              <div className="text-xs text-gray-500">No media attached</div>
                            ) : (
                              <div className="flex gap-3 flex-wrap">
                                {issue.media.map((src, idx) => (
                                  <img key={idx} src={src} alt={`media-${idx}`} className="w-40 h-24 object-cover rounded border" />
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="md:col-span-1">
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Department</label>
                              <select
                                value={issue.department}
                                onChange={(e) => updateDepartment(issue.id, e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
                              >
                                {allDepartments.map((d) => (
                                  <option key={d} value={d}>{d}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Status</label>
                              <select
                                value={issue.status}
                                onChange={(e) => setIssues((prev) => prev.map((it) => it.id === issue.id ? { ...it, status: e.target.value } : it))}
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
                              >
                                {allStatuses.map((s) => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default IssuesPage;

