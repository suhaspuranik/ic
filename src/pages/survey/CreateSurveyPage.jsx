import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { iConnect_create_survey_web, iConnect_get_all_wards_web, iConnect_get_all_booths_web } from "../../apis/SurveyApis";

const CreateSurveyPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const existingSurveyData = location.state?.surveyData;

  // Normalize existing data to handle both local and API formats
  const normalizedExisting = existingSurveyData
    ? {
        name: existingSurveyData.name || existingSurveyData.title || "",
        description: existingSurveyData.description || "",
        questions: (existingSurveyData.questions || []).map((q) => ({
          text: q.text || q.question_text || "",
          type: q.type || q.question_type || "radio",
          options: q.options || [],
          id: q.id || Date.now(),
        })),
      }
    : {
        name: "",
        description: "",
        questions: [],
      };

  const [surveyData, setSurveyData] = useState(normalizedExisting);
  const [currentQuestion, setCurrentQuestion] = useState({
    text: "",
    type: "radio",
    options: ["", ""],
  });
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showSubmitOptions, setShowSubmitOptions] = useState(false);
  const [submitOptions, setSubmitOptions] = useState({
    targetBoothType: "Weak",
    deadline: null,
    wardId: "",
    boothId: "",
  });
  const [wards, setWards] = useState([]);
  const [booths, setBooths] = useState([]);
  const [isBoothsLoading, setIsBoothsLoading] = useState(false);

  // Valid booth types
  const validBoothTypes = ["Strong", "Weak", "Swing", "All"];

  // Check authentication on mount
  useEffect(() => {
    const partyWorkerId = sessionStorage.getItem("party_worker_id");
    if (!partyWorkerId) {
      showToastMessage("Please log in to continue.");
      navigate("/login");
    }
    console.log("Initial party_worker_id:", partyWorkerId);
  }, [navigate]);

  // Debug: Log submitOptions and booths state
  useEffect(() => {
    console.log("submitOptions updated:", JSON.stringify({
      ...submitOptions,
      deadline: submitOptions.deadline ? submitOptions.deadline.toISOString() : null
    }, null, 2));
    console.log("Current booths state:", JSON.stringify(booths, null, 2));
    console.log("Booths loading:", isBoothsLoading);
  }, [submitOptions, booths, isBoothsLoading]);

  // Fetch wards when modal opens
  useEffect(() => {
    if (showSubmitOptions) {
      const fetchWards = async () => {
        try {
          const partyWorkerId = sessionStorage.getItem("party_worker_id");
          if (!partyWorkerId) {
            throw new Error("Invalid party_worker_id: Not logged in");
          }
          console.log("Fetching wards with payload:", { party_worker_id: partyWorkerId });
          const wardData = await iConnect_get_all_wards_web({ party_worker_id: partyWorkerId });
          console.log("Wards fetched:", JSON.stringify(wardData, null, 2));
          if (!Array.isArray(wardData)) {
            throw new Error("Invalid wards data: Expected an array");
          }
          setWards(wardData);
          if (wardData.length > 0) {
            setSubmitOptions((prev) => ({
              ...prev,
              wardId: wardData[0].ward_id || wardData[0].id || "",
            }));
          } else {
            showToastMessage("No wards available for selection.");
          }
        } catch (err) {
          console.error("Failed to fetch wards:", err.message);
          showToastMessage("Failed to load wards: " + err.message);
          setWards([]);
        }
      };
      fetchWards();
    }
  }, [showSubmitOptions]);

  // Fetch booths when wardId changes
  useEffect(() => {
    if (submitOptions.wardId) {
      const fetchBooths = async () => {
        try {
          setIsBoothsLoading(true);
          const partyWorkerId = sessionStorage.getItem("party_worker_id");
          if (!partyWorkerId) {
            throw new Error("Invalid party_worker_id: Not logged in");
          }
          if (!submitOptions.wardId) {
            throw new Error("Invalid ward_id: Ward not selected");
          }
          console.log("Fetching booths with payload:", {
            party_worker_id: partyWorkerId,
            ward_id: submitOptions.wardId,
          });
          const boothData = await iConnect_get_all_booths_web({
            party_worker_id: partyWorkerId,
            ward_id: submitOptions.wardId,
          });
          console.log("Booths fetched:", JSON.stringify(boothData, null, 2));
          if (!Array.isArray(boothData)) {
            throw new Error("Invalid booths data: Expected an array");
          }
          setBooths(boothData);
          if (boothData.length > 0 && submitOptions.targetBoothType !== "All") {
            setSubmitOptions((prev) => ({
              ...prev,
              boothId: boothData[0].booth_id || boothData[0].id || "",
            }));
          } else if (boothData.length === 0) {
            showToastMessage("No booths available for the selected ward.");
          }
        } catch (err) {
          console.error("Failed to fetch booths:", err.message);
          showToastMessage("Failed to load booths: " + err.message);
          setBooths([]);
        } finally {
          setIsBoothsLoading(false);
        }
      };
      fetchBooths();
    } else {
      setBooths([]);
      setSubmitOptions((prev) => ({ ...prev, boothId: "" }));
    }
  }, [submitOptions.wardId]);

  // Removed external Preview button support (as per incoming changes)

  const handleSurveyChange = (e) => {
    const { name, value } = e.target;
    setSurveyData({
      ...surveyData,
      [name]: value,
    });
  };

  const handleQuestionChange = (e) => {
    const { name, value } = e.target;
    setCurrentQuestion({
      ...currentQuestion,
      [name]: value,
    });
  };

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...currentQuestion.options];
    updatedOptions[index] = value;
    setCurrentQuestion({
      ...currentQuestion,
      options: updatedOptions,
    });
  };

  const addOption = () => {
    if (currentQuestion.options.length < 8) {
      setCurrentQuestion({
        ...currentQuestion,
        options: [...currentQuestion.options, ""],
      });
    }
  };

  const removeOption = (index) => {
    if (currentQuestion.options.length > 2) {
      const updatedOptions = [...currentQuestion.options];
      updatedOptions.splice(index, 1);
      setCurrentQuestion({
        ...currentQuestion,
        options: updatedOptions,
      });
    }
  };

  const addOrUpdateQuestion = () => {
    if (
      currentQuestion.text.trim() === "" ||
      currentQuestion.options.some((opt) => opt.trim() === "") ||
      currentQuestion.options.length < 2
    ) {
      showToastMessage(
        "Please fill in all question fields and ensure at least 2 options"
      );
      return;
    }

    const newQuestion = { ...currentQuestion, id: Date.now() };
    if (editingQuestionIndex !== null) {
      const updatedQuestions = [...surveyData.questions];
      updatedQuestions[editingQuestionIndex] = newQuestion;
      setSurveyData({
        ...surveyData,
        questions: updatedQuestions,
      });
      setEditingQuestionIndex(null);
      showToastMessage("Question updated successfully!");
    } else {
      setSurveyData({
        ...surveyData,
        questions: [...surveyData.questions, newQuestion],
      });
      showToastMessage("Question added successfully!");
    }

    setCurrentQuestion({
      text: "",
      type: "radio",
      options: ["", ""],
    });
  };

  const editQuestion = (index) => {
    setCurrentQuestion({ ...surveyData.questions[index] });
    setEditingQuestionIndex(index);
  };

  const deleteQuestion = (index) => {
    const updatedQuestions = surveyData.questions.filter((_, i) => i !== index);
    setSurveyData({
      ...surveyData,
      questions: updatedQuestions,
    });
    showToastMessage("Question deleted successfully!");
  };

  const saveDraft = async () => {
    if (surveyData.questions.length === 0) {
      showToastMessage("Please add at least one question before saving draft");
      return;
    }

    const payload = {
      party_worker_id: sessionStorage.getItem("party_worker_id"),
      title: surveyData.name || "Untitled Survey",
      description: surveyData.description || "",
      questions: surveyData.questions.map((q) => ({
        question_text: q.text || q.question_text || "",
        question_type: q.type || q.question_type || "radio",
        options: q.options || [],
      })),
      status: "Draft",
    };

    try {
      console.log("Saving draft with payload:", JSON.stringify(payload, null, 2));
      const res = await iConnect_create_survey_web(payload);
      if (res && (res.p_out_mssg_flg === "S" || res.p_out_mssg_flg === "D")) {
        showToastMessage(res.p_out_mssg || "Draft saved successfully");
      } else {
        showToastMessage(res.p_out_mssg || "Failed to save draft");
      }
    } catch (err) {
      console.error("saveDraft error:", err);
      showToastMessage("Network or server error while saving draft");
    }
  };

  const submitSurvey = () => {
    if (surveyData.questions.length === 0) {
      showToastMessage("Please add at least one question to submit");
      return;
    }
    setShowSubmitOptions(true);
  };

  const handleSubmitOptionsChange = (e) => {
    const { name, value } = e.target;
    console.log("handleSubmitOptionsChange:", { name, value });
    if (name === "targetBoothType" && !validBoothTypes.includes(value)) {
      console.warn("Invalid booth type selected:", value);
      showToastMessage("Invalid Target Booth Type selected. Please choose Strong, Weak, Swing, or All.");
      return;
    }
    setSubmitOptions((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "wardId" ? { boothId: "" } : {}),
      ...(name === "targetBoothType" && value === "All" ? { boothId: "" } : {}),
    }));
  };

  const handleDateChange = (date) => {
    console.log("handleDateChange:", date ? date.toISOString() : null);
    setSubmitOptions((prev) => ({
      ...prev,
      deadline: date,
    }));
  };

  const formatDateToMySQL = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      console.warn("Invalid date provided for formatDateToMySQL:", date);
      const now = new Date();
      const fallback = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
      console.log("Using fallback date:", fallback);
      return fallback;
    }
    const year = date.getFullYear();
    if (String(year).length !== 4 || year < 2025 || year > 2030) {
      console.warn("Invalid year in date:", year);
      const now = new Date();
      const fallback = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
      console.log("Using fallback date due to invalid year:", fallback);
      return fallback;
    }
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    console.log("Formatted date:", formattedDate);
    return formattedDate;
  };

  const handleSubmitSurvey = async () => {
    if (
      !submitOptions.targetBoothType ||
      !validBoothTypes.includes(submitOptions.targetBoothType) ||
      !submitOptions.deadline ||
      !submitOptions.wardId ||
      (submitOptions.targetBoothType !== "All" && !submitOptions.boothId)
    ) {
      showToastMessage(
        "Please fill in all required fields with valid values: Target Booth Type (Strong, Weak, Swing, All), Deadline, Ward, and Booth (if not All)"
      );
      return;
    }

    // Validate deadline is in the future
    const now = new Date();
    if (submitOptions.deadline <= now) {
      showToastMessage("Deadline must be in the future");
      return;
    }

    const formattedBoothType = validBoothTypes.find(
      (type) => type.toLowerCase() === submitOptions.targetBoothType.toLowerCase()
    ) || submitOptions.targetBoothType;
    console.log("Formatted booth type in handleSubmitSurvey:", formattedBoothType);

    const formattedDeadline = formatDateToMySQL(submitOptions.deadline);
    if (!formattedDeadline || !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(formattedDeadline)) {
      showToastMessage("Invalid deadline format. Please select a valid date and time.");
      return;
    }

    const payload = {
      party_worker_id: sessionStorage.getItem("party_worker_id"),
      title: surveyData.name || "Untitled Survey",
      description: surveyData.description || "",
      questions: surveyData.questions.map((q) => ({
        question_text: q.text || q.question_text || "",
        question_type: q.type || q.question_type || "radio",
        options: q.options || [],
      })),
      status: "Pending",
      booth_type: formattedBoothType,
      deadline: formattedDeadline,
      ward_id: submitOptions.wardId,
      booth_id: submitOptions.boothId || null,
    };

    try {
      console.log("Frontend payload before API call:", JSON.stringify(payload, null, 2));
      const res = await iConnect_create_survey_web(payload);
      console.log("API response:", JSON.stringify(res, null, 2));
      if (res && (res.p_out_mssg_flg === "S" || res.p_out_mssg_flg === "D")) {
        showToastMessage(res.p_out_mssg || "Survey submitted successfully");
        setTimeout(() => navigate("/survey-dashboard"), 1500);
      } else {
        showToastMessage(res.p_out_mssg || "Failed to submit survey");
      }
    } catch (err) {
      console.error("handleSubmitSurvey error:", err);
      showToastMessage("Network or server error while submitting survey");
    }
    setShowSubmitOptions(false);
  };

  const showToastMessage = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const Toast = ({ message, show }) => (
    <div
      className={`fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 z-50 ${
        show ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      }`}
    >
      <div className="flex items-center">
        <span className="material-icons-outlined mr-2">check_circle</span>
        {message}
      </div>
    </div>
  );

  const SubmitOptionsModal = ({ show, onClose, onSubmit }) => {
    if (!show) return null;

    const currentYear = new Date().getFullYear();
    const minDate = new Date();
    const maxDate = new Date(currentYear + 5, 11, 31, 23, 59, 59);

    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
          <h2 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">
            Submit Survey Options
          </h2>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="targetBoothType"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
              >
                Target Booth Type
              </label>
              <select
                id="targetBoothType"
                name="targetBoothType"
                value={submitOptions.targetBoothType}
                onChange={handleSubmitOptionsChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
              >
                <option value="Strong">Strong Booths</option>
                <option value="Weak">Weak Booths</option>
                <option value="Swing">Swing Booths</option>
                <option value="All">All Booths</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="deadline"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
              >
                Deadline
              </label>
              <DatePicker
                selected={submitOptions.deadline}
                onChange={handleDateChange}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="yyyy-MM-dd HH:mm"
                minDate={minDate}
                maxDate={maxDate}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
                placeholderText="Select date and time"
              />
            </div>
            <div>
              <label
                htmlFor="wardId"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
              >
                Ward
              </label>
              <select
                id="wardId"
                name="wardId"
                value={submitOptions.wardId}
                onChange={handleSubmitOptionsChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
              >
                <option value="">Select a Ward</option>
                {wards.map((ward) => (
                  <option key={ward.ward_id || ward.id} value={ward.ward_id || ward.id}>
                    {ward.name || ward.ward_name || `Ward ${ward.ward_id || ward.id}`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="boothId"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
              >
                Booth Address
              </label>
              <select
                id="boothId"
                name="boothId"
                value={submitOptions.boothId}
                onChange={handleSubmitOptionsChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
                disabled={submitOptions.targetBoothType === "All" || isBoothsLoading}
              >
                <option value="">Select a Booth</option>
                {isBoothsLoading ? (
                  <option disabled>Loading booths...</option>
                ) : booths.length === 0 ? (
                  <option disabled>No booths available</option>
                ) : (
                  booths.map((booth) => (
                    <option key={booth.booth_id || booth.id} value={booth.booth_id || booth.id}>
                      {booth.booth_address || booth.booth_number || `Booth ${booth.booth_id || booth.id}`}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              disabled={
                !submitOptions.targetBoothType ||
                !validBoothTypes.includes(submitOptions.targetBoothType) ||
                !submitOptions.deadline ||
                !submitOptions.wardId ||
                (submitOptions.targetBoothType !== "All" && !submitOptions.boothId) ||
                isBoothsLoading
              }
            >
              Submit Survey
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="pt-0 px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Create Survey</h1>
          <p className="text-sm text-[var(--text-secondary)]">Build questions and configure target audience</p>
        </div>
        <div className="hidden md:flex gap-3">
          <button
            type="button"
            onClick={saveDraft}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center"
          >
            <span className="material-icons-outlined mr-2 text-base">save</span>
            <span className="align-middle">Save Draft</span>
          </button>
          <button
            type="button"
            onClick={submitSurvey}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <span className="material-icons-outlined mr-2 text-base">send</span>
            <span className="align-middle">Submit Survey</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Survey Details */}
          <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">Survey Details</h2>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Survey Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={surveyData.name}
                  onChange={handleSurveyChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
                  placeholder="Enter survey name"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Description / Objective</label>
                <textarea
                  id="description"
                  name="description"
                  value={surveyData.description}
                  onChange={handleSurveyChange}
                  rows="3"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
                  placeholder="Describe the purpose of this survey"
                ></textarea>
              </div>
            </div>
          </div>

          {/* Add/Edit Question Form */}
          <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">{editingQuestionIndex !== null ? "Edit Question" : "Add New Question"}</h2>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="questionText" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Question Text</label>
                <input
                  type="text"
                  id="questionText"
                  name="text"
                  value={currentQuestion.text}
                  onChange={handleQuestionChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
                  placeholder="Enter your question"
                />
              </div>
              <div>
                <label htmlFor="questionType" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Question Type</label>
                <select
                  id="questionType"
                  name="type"
                  value={currentQuestion.type}
                  onChange={handleQuestionChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
                >
                  <option value="radio">Single Choice (Radio)</option>
                  <option value="checkbox">Multiple Choice (Checkbox)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Options ({currentQuestion.options.length}/8)</label>
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
                      placeholder={`Option ${index + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className={`${currentQuestion.options.length <= 2 ? "text-gray-400 cursor-not-allowed" : "text-red-500 hover:text-red-700"} ml-2 p-2`}
                      disabled={currentQuestion.options.length <= 2}
                    >
                      <span className="material-icons-outlined">delete</span>
                    </button>
                  </div>
                ))}
                {currentQuestion.options.length < 8 && (
                  <button type="button" onClick={addOption} className="mt-3 flex items-center text-blue-600 hover:text-blue-800">
                    <span className="material-icons-outlined mr-1">add_circle</span>
                    Add Option
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={addOrUpdateQuestion}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                  <span className="material-icons-outlined mr-2 text-base">add</span>
                  <span className="align-middle">{editingQuestionIndex !== null ? "Update Question" : "Add Question"}</span>
                </button>
                {editingQuestionIndex !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentQuestion({ text: "", type: "radio", options: ["", ""] });
                      setEditingQuestionIndex(null);
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center"
                  >
                    <span className="material-icons-outlined mr-2 text-base">cancel</span>
                    <span className="align-middle">Cancel Edit</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Questions List */}
          <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">
              Questions ({surveyData.questions.length})
            </h2>
            {surveyData.questions.length > 0 ? (
              <div className="space-y-4 mb-6">
                {surveyData.questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="border border-gray-200 rounded-lg p-4 bg-white"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-medium">
                        {index + 1}. {question.text || "Untitled Question"}
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => editQuestion(index)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <span className="material-icons-outlined">edit</span>
                        </button>
                        <button
                          onClick={() => deleteQuestion(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <span className="material-icons-outlined">delete</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Type: {question.type === "radio" ? "Single Choice" : "Multiple Choice"}
                    </p>
                    <ul className="list-disc pl-5">
                      {question.options.map((option, optIndex) => (
                        <li key={optIndex} className="text-sm">
                          {option || `Option ${optIndex + 1}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 mb-4">No questions added yet</p>
            )}
          </div>
        </div>

        {/* Right Panel - Live Preview */}
        <div className="space-y-6">
          <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-slate-200 p-6 sticky top-4">
            <h2 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">Live Preview ({surveyData.questions.length})</h2>
            {surveyData.questions.length > 0 ? (
              <div className="space-y-4">
                {surveyData.questions.map((question, index) => (
                  <div key={question.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                    <div className="flex items-center mb-2">
                      <h3 className="text-lg font-medium">{index + 1}. {question.text || "Untitled Question"}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Type: {question.type === "radio" ? "Single Choice" : "Multiple Choice"}</p>
                    <ul className="list-disc pl-5">
                      {question.options.map((option, optIndex) => (
                        <li key={optIndex} className="text-sm">{option || `Option ${optIndex + 1}`}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No questions added yet</p>
            )}
            {/* Mobile actions */}
            <div className="mt-6 flex md:hidden justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate("/survey-preview", { state: { surveyData, editable: true } })}
                className="px-4 py-2 border border-gray-300 rounded-lg text-[var(--text-primary)] hover:bg-gray-50"
              >
                Preview & Edit
              </button>
              <button
                type="button"
                onClick={saveDraft}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={submitSurvey}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Submit Survey
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <Toast message={toastMessage} show={showToast} />

      {/* Submit Options Modal */}
      <SubmitOptionsModal
        show={showSubmitOptions}
        onClose={() => setShowSubmitOptions(false)}
        onSubmit={handleSubmitSurvey}
      />
    </div>
  );
};

export default CreateSurveyPage;