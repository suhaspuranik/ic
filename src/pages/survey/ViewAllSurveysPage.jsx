import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { iConnect_get_survey_details_web } from "../../apis/SurveyApis";

const ViewAllSurveysPage = () => {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    search: "",
    boothType: "",
    dateFrom: "",
    dateTo: "",
    status: "",
  });

  // User role state (for demonstration)
  const [userRole] = useState("Assembly Head"); // or 'Ward President'
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        setLoading(true);
        const party_worker_id = sessionStorage.getItem("party_worker_id") || "0";
        const data = await iConnect_get_survey_details_web({ party_worker_id });
        const normalized = (data || []).map((s, idx) => {
          const responses = Number(s.responses ?? s.response_count ?? s.responses_count ?? 0);
          const eligible = Number(
            s.eligible_workers_count ?? s.eligibleWorkersCount ?? s.eligible_workers ?? s.eligible ?? 0
          );
          const createdDate = s.created_at || s.created_date || s.createdAt || s.createdOn || s.created || "";
          const deadline = s.deadline || s.due_date || s.expiry_date || "";
          const baseStatus = s.status || "Draft";
          const status = getStatus({ status: baseStatus, deadline });
          return {
            id: s.survey_id || s.id || s.ID || idx,
            name: s.title || s.name || s.survey_name || "Untitled",
            createdDate,
            targetBooth: s.target_booth || s.targetBooth || s.target || s.target_booth_type || "All",
            status,
            responses,
            eligible,
            deadline,
            raw: s,
          };
        });
        // Sort by createdDate desc
        normalized.sort((a, b) => {
          const da = a.createdDate ? Date.parse(a.createdDate) : 0;
          const db = b.createdDate ? Date.parse(b.createdDate) : 0;
          return db - da;
        });
        setSurveys(normalized);
      } catch (err) {
        console.error("Failed to fetch surveys:", err);
        setSurveys([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSurveys();
  }, []);

  const isExpired = (deadline) => {
    if (!deadline) return false;
    const deadlineDate = Date.parse(deadline);
    if (Number.isNaN(deadlineDate)) return false;
    return deadlineDate < Date.now();
  };

  const getStatus = (survey) => {
    if ((survey.status || "").toLowerCase() === "completed") return "Completed";
    if (isExpired(survey.deadline)) return "Expired";
    return survey.status || "Draft";
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      boothType: "",
      dateFrom: "",
      dateTo: "",
      status: "",
    });
  };

  // Apply filters to surveys
  const filteredSurveys = surveys.filter((survey) => {
    // Search by name
    if (filters.search && !survey.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
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

  const openSurvey = (survey) => {
    const raw = survey.raw || {};
    let questions = [];
    try {
      if (typeof raw.questions === "string") {
        questions = JSON.parse(raw.questions || "[]");
      } else if (Array.isArray(raw.questions)) {
        questions = raw.questions;
      }
    } catch (e) {
      console.warn("Failed to parse survey questions", e);
      questions = [];
    }

    const normalizedQuestions = questions.map((q, idx) => ({
      id: q.question_id || q.id || Date.now() + idx,
      text: q.question_text || q.text || "",
      type: q.question_type || q.type || "radio",
      options: (q.options || []).map((op) => op.option_text || op.text || "") || [],
    }));

    const surveyData = {
      id: survey.id || raw.survey_id || raw.id || raw.ID,
      name: survey.name || raw.title || raw.name || "",
      description: raw.description || "",
      questions: normalizedQuestions,
      createdDate:
        survey.createdDate || raw.created_at || raw.created_date || raw.createdAt || raw.createdOn || raw.created || "",
      deadline: survey.deadline || raw.deadline || raw.due_date || raw.expiry_date || "",
      targetBooth:
        survey.targetBooth || raw.target_booth || raw.targetBooth || raw.target || raw.target_booth_type || "All",
      status: survey.status || raw.status || "Draft",
      responses:
        typeof survey.responses === "number"
          ? survey.responses
          : Number(raw.responses ?? raw.response_count ?? raw.responses_count ?? 0),
      eligible:
        typeof survey.eligible === "number"
          ? survey.eligible
          : Number(
              raw.eligible_workers_count ??
                raw.eligibleWorkersCount ??
                raw.eligible_workers ??
                raw.eligible ??
                0
            ),
    };

    const isDraft = (survey.status || "").toLowerCase() === "draft";
    if (isDraft) {
      navigate("/create-survey", { state: { surveyData } });
    } else {
      navigate("/survey-preview", { state: { surveyData, editable: false } });
    }
  };

  return (
    <div className="pt-0 px-8">
      {/* Filters */}
      <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <label
              htmlFor="search"
              className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
            >
              Search
            </label>
            <input
              id="search"
              name="search"
              type="text"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search surveys..."
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
            />
          </div>
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
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    Loading surveys...
                  </td>
                </tr>
              ) : filteredSurveys.length > 0 ? (
                filteredSurveys.map((survey) => (
                  <tr
                    key={survey.id}
                    onClick={() => openSurvey(survey)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") openSurvey(survey);
                    }}
                    tabIndex={0}
                    role="button"
                    className="hover:bg-gray-50 cursor-pointer"
                  >
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
                            : survey.status === "Completed"
                            ? "bg-green-100 text-green-800"
                            : survey.status === "Expired"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {survey.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                      {typeof survey.eligible === "number" && survey.eligible > 0
                        ? `${survey.responses}/${survey.eligible}`
                        : `${survey.responses}/${survey.eligible ?? 0}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <a
                          href={`/survey-results/${survey.id}`}
                          onClick={(e) => e.stopPropagation()}
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
