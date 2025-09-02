import { useState } from "react";

const ViewAllSurveysPage = () => {
  // Sample data for demonstration
  const [surveys] = useState([
    {
      id: 1,
      name: "Voter Satisfaction Survey",
      createdDate: "2023-06-15",
      targetBooth: "All",
      status: "Completed",
      responses: 245,
    },
    {
      id: 2,
      name: "Infrastructure Needs",
      createdDate: "2023-06-10",
      targetBooth: "Strong",
      status: "Completed",
      responses: 189,
    },
    {
      id: 3,
      name: "Youth Engagement",
      createdDate: "2023-06-05",
      targetBooth: "Weak",
      status: "Pending",
      responses: 87,
    },
    {
      id: 4,
      name: "Senior Citizen Needs",
      createdDate: "2023-06-01",
      targetBooth: "Swing",
      status: "Pending",
      responses: 56,
    },
    {
      id: 5,
      name: "Education Priorities",
      createdDate: "2023-05-25",
      targetBooth: "All",
      status: "Completed",
      responses: 312,
    },
    {
      id: 6,
      name: "Healthcare Access",
      createdDate: "2023-05-20",
      targetBooth: "Weak",
      status: "Completed",
      responses: 178,
    },
    {
      id: 7,
      name: "Employment Opportunities",
      createdDate: "2023-05-15",
      targetBooth: "Strong",
      status: "Completed",
      responses: 203,
    },
    {
      id: 8,
      name: "Transportation Issues",
      createdDate: "2023-05-10",
      targetBooth: "Swing",
      status: "Completed",
      responses: 167,
    },
  ]);

  // Filter states
  const [filters, setFilters] = useState({
    boothType: "",
    dateFrom: "",
    dateTo: "",
    status: "",
  });

  // User role state (for demonstration)
  const [userRole] = useState("Assembly Head"); // or 'Ward President'

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  const resetFilters = () => {
    setFilters({
      boothType: "",
      dateFrom: "",
      dateTo: "",
      status: "",
    });
  };

  // Apply filters to surveys
  const filteredSurveys = surveys.filter((survey) => {
    // Filter by booth type
    if (
      filters.boothType &&
      survey.targetBooth !== filters.boothType &&
      filters.boothType !== "All"
    ) {
      return false;
    }

    // Filter by date range
    if (
      filters.dateFrom &&
      new Date(survey.createdDate) < new Date(filters.dateFrom)
    ) {
      return false;
    }
    if (
      filters.dateTo &&
      new Date(survey.createdDate) > new Date(filters.dateTo)
    ) {
      return false;
    }

    // Filter by status
    if (filters.status && survey.status !== filters.status) {
      return false;
    }

    return true;
  });

  const handleViewResults = (surveyId) => {
    // In a real app, this would navigate to the results page
    console.log(`View results for survey ${surveyId}`);
    alert(`Viewing results for survey ${surveyId}`);
  };

  const handleDownload = (surveyId, type) => {
    console.log(`Download ${type} results for survey ${surveyId}`);
    alert(`Downloading ${type} results for survey ${surveyId}`);
  };

  return (
    <div className="pt-0 px-8">
      {/* Filters */}
      <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label
              htmlFor="boothType"
              className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
            >
              Booth Type
            </label>
            <select
              id="boothType"
              name="boothType"
              value={filters.boothType}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
            >
              <option value="">All Booths</option>
              <option value="Strong">Strong</option>
              <option value="Weak">Weak</option>
              <option value="Swing">Swing</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="dateFrom"
              className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
            >
              Date From
            </label>
            <input
              type="date"
              id="dateFrom"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
            />
          </div>
          <div>
            <label
              htmlFor="dateTo"
              className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
            >
              Date To
            </label>
            <input
              type="date"
              id="dateTo"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
            />
          </div>
          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
            >
              Status
            </label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
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

      {/* Surveys Table */}
      <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  Survey Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  Created Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  Target Booth
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  Responses
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSurveys.length > 0 ? (
                filteredSurveys.map((survey) => (
                  <tr key={survey.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--text-primary)]">
                      {survey.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                      {survey.createdDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                      {survey.targetBooth}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          survey.status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {survey.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                      {survey.responses}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <a
                          href={`/survey-results/${survey.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Results
                        </a>

                        {userRole === "Assembly Head" && (
                          <div className="relative group">
                            <button className="text-green-600 hover:text-green-900">
                              Download
                            </button>
                            <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                              <button
                                onClick={() =>
                                  handleDownload(survey.id, "overall")
                                }
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                              >
                                Overall Results
                              </button>
                              <button
                                onClick={() =>
                                  handleDownload(survey.id, "booth-wise")
                                }
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                              >
                                Booth-wise Results
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No surveys found matching the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ViewAllSurveysPage;
