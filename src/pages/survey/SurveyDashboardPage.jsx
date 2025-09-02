import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { iConnect_get_survey_details_web, iConnect_update_expired_surveys_web } from "../../apis/SurveyApis";

const SurveyDashboardPage = () => {
  const [recentSurveys, setRecentSurveys] = useState([]);
  const [loadingSurveys, setLoadingSurveys] = useState(false);

  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        setLoadingSurveys(true);
        const party_worker_id = sessionStorage.getItem("party_worker_id") || "0";
        const surveys = await iConnect_get_survey_details_web({ party_worker_id });
        console.log("Raw surveys response:", surveys);
        const normalized = (surveys || []).map((s) => {
          const responses = Number(s.responses ?? s.response_count ?? s.responses_count ?? 0);
          const eligible = Number(
            s.eligible_workers_count ?? s.eligibleWorkersCount ?? s.eligible_workers ?? s.eligible ?? 0
          );
          return {
            name: s.title || s.name || s.survey_name || "Untitled",
            createdDate:
              s.created_at || s.created_date || s.createdAt || s.createdOn || s.created || "",
            deadline: s.deadline || s.due_date || s.expiry_date || "",
            targetBooth: s.target_booth || s.targetBooth || s.target || s.target_booth_type || "All",
            status: s.status || "Draft",
            responses,
            eligible,
            raw: s,
          };
        });

        // Identify expired surveys (exclude Completed surveys)
        const expiredSurveys = normalized.filter(
          (s) => isExpired(s.deadline) && s.status.toLowerCase() !== "completed"
        );
        console.log("Expired surveys:", expiredSurveys.map(s => ({
          name: s.name,
          deadline: s.deadline,
          status: s.status,
          survey_id: s.raw.survey_id
        })));
        if (expiredSurveys.length > 0) {
          const surveyIds = expiredSurveys
            .map((s) => s.raw.survey_id || s.raw.id || s.raw.ID)
            .filter((id) => id != null && id !== "");
          console.log("Survey IDs for update:", surveyIds);
          
          if (surveyIds.length > 0) {
            try {
              const payload = { survey_ids: surveyIds, party_worker_id };
              console.log("Sending payload to iConnect_update_expired_surveys_web:", payload);
              await iConnect_update_expired_surveys_web(payload);
              // Update status locally for expired surveys with valid IDs, excluding Completed
              normalized.forEach((s) => {
                const surveyId = s.raw.survey_id || s.raw.id || s.raw.ID;
                if (
                  isExpired(s.deadline) &&
                  s.status.toLowerCase() !== "completed" &&
                  surveyId &&
                  surveyIds.includes(surveyId)
                ) {
                  s.status = "Expired";
                }
              });
            } catch (err) {
              console.error("Failed to update expired surveys:", err);
            }
          } else {
            console.warn("No valid survey IDs found for expired surveys:", expiredSurveys.map(s => ({
              name: s.name,
              survey_id: s.raw.survey_id,
              id: s.raw.id,
              ID: s.raw.ID,
              raw: s.raw
            })));
            // Update status locally to Expired for display, excluding Completed surveys
            normalized.forEach((s) => {
              if (isExpired(s.deadline) && s.status.toLowerCase() !== "completed") {
                s.status = "Expired";
              }
            });
          }
        }

        // Sort by createdDate descending
        normalized.sort((a, b) => {
          const da = a.createdDate ? Date.parse(a.createdDate) : 0;
          const db = b.createdDate ? Date.parse(b.createdDate) : 0;
          return db - da;
        });

        setRecentSurveys(normalized);
      } catch (err) {
        console.error("Failed to fetch surveys:", err);
        setRecentSurveys([]);
      } finally {
        setLoadingSurveys(false);
      }
    };

    fetchSurveys();
  }, []);

  const navigate = useNavigate();

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
      options:
        (q.options || []).map((op) => op.option_text || op.text || "") || [],
    }));

    const surveyData = {
      id: raw.survey_id || raw.id || raw.ID,
      name: survey.name || raw.title || raw.name || "",
      description: raw.description || "",
      questions: normalizedQuestions,
      createdDate: survey.createdDate || raw.created_at || raw.created_date || raw.createdAt || raw.createdOn || raw.created || "",
      deadline: survey.deadline || raw.deadline || raw.due_date || raw.expiry_date || "",
      targetBooth: survey.targetBooth || raw.target_booth || raw.targetBooth || raw.target || raw.target_booth_type || "All",
      status: survey.status || raw.status || "Draft",
      responses: typeof survey.responses === "number" ? survey.responses : Number(raw.responses ?? raw.response_count ?? raw.responses_count ?? 0),
      eligible: typeof survey.eligible === "number" ? survey.eligible : Number(raw.eligible_workers_count ?? raw.eligibleWorkersCount ?? raw.eligible_workers ?? raw.eligible ?? 0),
    };

    const isDraft = (survey.status || "").toLowerCase() === "draft";
    if (isDraft) {
      navigate("/create-survey", { state: { surveyData } });
    } else {
      navigate("/survey-preview", { state: { surveyData, editable: false } });
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const ts = Date.parse(dateStr);
    if (Number.isNaN(ts)) return dateStr;
    return new Date(ts).toLocaleDateString();
  };

  const isExpired = (deadline) => {
    if (!deadline) return false;
    const deadlineDate = Date.parse(deadline);
    console.log("Parsing deadline:", deadline, "Result:", deadlineDate);
    if (Number.isNaN(deadlineDate)) return false;
    return deadlineDate < Date.now();
  };

  const getStatus = (survey) => {
    // Do not mark Completed surveys as Expired, even if deadline has passed
    if (survey.status.toLowerCase() === "completed") return "Completed";
    if (isExpired(survey.deadline)) return "Expired";
    return survey.status;
  };

  const totalSurveys = recentSurveys.length;
  const completedSurveys = recentSurveys.filter((s) => (s.status || "").toLowerCase() === "completed").length;
  const pendingSurveys = totalSurveys - completedSurveys;
  const participationRate = totalSurveys > 0 ? Math.round((recentSurveys.filter((s) => Number(s.responses) > 0).length / totalSurveys) * 100) : 0;

  return (
    <div className="pt-0 px-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-[var(--bg-card)] p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center">
            <div className="bg-blue-100 p-4 rounded-full">
              <span className="material-icons-outlined text-blue-600 text-3xl">
                assignment
              </span>
            </div>
            <div className="ml-4">
              <p className="text-3xl font-bold text-[var(--text-primary)]">
                {totalSurveys}
              </p>
              <p className="text-[var(--text-secondary)]">Total Surveys</p>
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-card)] p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center">
            <div className="bg-green-100 p-4 rounded-full">
              <span className="material-icons-outlined text-green-600 text-3xl">
                check_circle
              </span>
            </div>
            <div className="ml-4">
              <p className="text-3xl font-bold text-[var(--text-primary)]">
                {completedSurveys}
              </p>
              <p className="text-[var(--text-secondary)]">Completed Surveys</p>
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-card)] p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center">
            <div className="bg-orange-100 p-4 rounded-full">
              <span className="material-icons-outlined text-orange-600 text-3xl">
                pending
              </span>
            </div>
            <div className="ml-4">
              <p className="text-3xl font-bold text-[var(--text-primary)]">
                {pendingSurveys}
              </p>
              <p className="text-[var(--text-secondary)]">Pending Surveys</p>
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-card)] p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-purple-100 p-4 rounded-full">
                <span className="material-icons-outlined text-purple-600 text-3xl">
                  pie_chart
                </span>
              </div>
              <div className="ml-4">
                <p className="text-3xl font-bold text-[var(--text-primary)]">
                  {participationRate}%
                </p>
                <p className="text-[var(--text-secondary)]">
                  Participation Rate
                </p>
              </div>
            </div>
            <div className="relative w-16 h-16">
              <svg viewBox="0 0 36 36" className="w-full h-full">
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="3"
                  strokeDasharray="100, 100"
                />
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#8B5CF6"
                  strokeWidth="3"
                  strokeDasharray={`${participationRate}, 100`}
                  className="stroke-purple-500"
                />
                <text
                  x="18"
                  y="20.35"
                  className="text-xs font-medium text-center fill-purple-600"
                  textAnchor="middle"
                >
                  {participationRate}%
                </text>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">
          Recent Surveys
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Survey Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Created Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Deadline
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Target Booth
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Responses
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loadingSurveys ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-[var(--text-secondary)]">
                    Loading surveys...
                  </td>
                </tr>
              ) : recentSurveys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-[var(--text-secondary)]">
                    No surveys found.
                  </td>
                </tr>
              ) : (
                recentSurveys.slice(0, 10).map((survey, index) => (
                  <tr
                    key={index}
                    onClick={() => openSurvey(survey)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") openSurvey(survey);
                    }}
                    tabIndex={0}
                    role="button"
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-[var(--text-primary)]">
                        {survey.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-[var(--text-secondary)]">
                        {formatDate(survey.createdDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-[var(--text-secondary)]">
                        {formatDate(survey.deadline)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-[var(--text-secondary)]">
                        {survey.targetBooth}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          getStatus(survey) === "Completed"
                            ? "bg-green-100 text-green-800"
                            : getStatus(survey) === "Expired"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {getStatus(survey)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)]">
                      {typeof survey.eligible === "number" && survey.eligible > 0
                        ? `${survey.responses}/${survey.eligible}`
                        : `${survey.responses}/${survey.eligible ?? 0}`}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SurveyDashboardPage;