import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  getBoothWorkers,
  getBoothDetails,
  createPartyWorker,
} from "../../apis/BoothWorkerApis";

const formatToday = () => new Date().toISOString().split("T")[0];

const computeNextWorkerNumber = (workers) => {
  if (!Array.isArray(workers) || workers.length === 0) return "PW001";
  // Workers are already sorted by party_worker_number; take last and increment
  const last = workers[workers.length - 1]?.party_worker_number || "PW000";
  const match = String(last).match(/^(\D*)(\d+)$/);
  if (!match) return "PW001";
  const prefix = match[1] || "PW";
  const num = parseInt(match[2], 10) + 1;
  const width = match[2].length;
  return `${prefix}${String(num).padStart(width, "0")}`;
};

const AddEditBoothWorkerPage = () => {
  const navigate = useNavigate();

  // Full backend-aligned form state
  const [formData, setFormData] = useState({
    party_worker_id: "",
    party_worker_number: "",
    name: "",
    gender: "",
    dob: "",
    address: "",
    town_village: "",
    district: "",
    state: "",
    pin_code: "",
    phone_number: "",
    email_id: "",
    username: "",
    password: "",
    assembly_id: "",
    ward_id: "",
    booth_id: "",
    referred_by: "",
    joining_date: formatToday(),
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const [booths, setBooths] = useState([]);
  const [loadingBooths, setLoadingBooths] = useState(false);
  const [loadingInit, setLoadingInit] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    type: "info",
    message: "",
  });
  const didInitRef = useRef(false);

  // Initialize: fetch booth list and compute next worker number
  useEffect(() => {
    if (didInitRef.current) return; // Prevent duplicate calls
    didInitRef.current = true;

    const init = async () => {
      try {
        setLoadingInit(true);
        const urlParams = new URLSearchParams(window.location.search);
        const editNumber = urlParams.get("id"); // could be party_worker_number
        if (editNumber) setIsEditMode(true);

        // Fetch existing workers to compute next number (sorted by party_worker_number)
        const currentPartyWorkerId =
          sessionStorage.getItem("party_worker_id") || "";
        const workersResp = await getBoothWorkers(currentPartyWorkerId);
        const workers = Array.isArray(workersResp?.RESULT)
          ? workersResp.RESULT
          : [];

        if (!editNumber) {
          const nextNo = computeNextWorkerNumber(workers);
          setFormData((prev) => ({ ...prev, party_worker_number: nextNo }));
        }

        // Prefill Assembly ID and Party Worker ID from session storage
        const asmId = sessionStorage.getItem("assembly_id") || "";
        const partyWorkerId = sessionStorage.getItem("party_worker_id") || "";
        setFormData((prev) => ({
          ...prev,
          assembly_id: asmId,
          party_worker_id: partyWorkerId,
        }));

        // Fetch booth list
        setLoadingBooths(true);
        const boothResp = await getBoothDetails();
        const boothList = Array.isArray(boothResp?.RESULT)
          ? boothResp.RESULT
          : [];
        setBooths(boothList);
      } catch {
        setError("Failed to initialize form data");
      } finally {
        setLoadingBooths(false);
        setLoadingInit(false);
      }
    };
    init();
  }, []);

  const showToast = (message, type = "info", durationMs = 4000) => {
    setToast({ visible: true, type, message });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => {
      setToast((t) => ({ ...t, visible: false }));
    }, durationMs);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBoothChange = (e) => {
    const { value } = e.target; // booth_id selected

    // Find the selected booth from the fetched booths list
    const selectedBooth = booths.find(
      (booth) => String(booth.booth_id) === String(value)
    );

    // Extract ward_id from the selected booth, handling both lowercase and uppercase keys
    const wardId = selectedBooth
      ? selectedBooth.ward_id || selectedBooth.WARD_ID || ""
      : "";

    setFormData((prev) => ({
      ...prev,
      booth_id: value,
      ward_id: wardId,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (
      !formData.party_worker_number ||
      !formData.name ||
      !formData.phone_number ||
      !formData.username ||
      !formData.password ||
      !formData.booth_id
    ) {
      showToast(
        "Please fill required fields: Worker Number, Name, Phone, Username, Password, and Booth",
        "error"
      );
      return;
    }

    try {
      setSubmitting(true);

      // Call the create API
      const response = await createPartyWorker(formData);

      // Robust success detection
      const resultArr = Array.isArray(response?.RESULT)
        ? response.RESULT
        : undefined;
      const resultObj =
        resultArr && resultArr.length > 0 ? resultArr[0] : undefined;

      const rawFlag =
        (response &&
          (response.p_out_mssg_flg ??
            response.RESULT?.p_out_mssg_flg ??
            response.result?.p_out_mssg_flg)) ??
        (resultObj && (resultObj.p_out_mssg_flg ?? resultObj.P_OUT_MSSG_FLG)) ??
        "";

      const flag = String(rawFlag).trim().toUpperCase();

      const rawMessage =
        (response &&
          (response.p_out_mssg ??
            response.RESULT?.p_out_mssg ??
            response.result?.p_out_mssg)) ??
        (resultObj && (resultObj.p_out_mssg ?? resultObj.P_OUT_MSSG)) ??
        "Party worker created successfully";

      const message = String(rawMessage).trim();

      // Infer success if flag is empty but message contains success phrases
      const inferredSuccess =
        !flag && /success|created|added/i.test(message || "");

      if (flag === "S" || inferredSuccess) {
        showToast(
          message || "Party worker added successfully!",
          "success",
          3000
        );
        window.setTimeout(() => {
          navigate("/booth-workers");
        }, 2500);
      } else {
        showToast(message || "Failed to add party worker", "error");
      }
    } catch (error) {
      console.error("Error creating party worker:", error);
      showToast("Could not add party worker. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-0 px-8">
      <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            {isEditMode ? "Edit Booth Worker" : "Add New Booth Worker"}
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {isEditMode
              ? "Update booth worker information"
              : "Enter the details to add a booth worker"}
          </p>
        </div>

        {error ? (
          <div className="mb-4 text-red-600 text-sm">{error}</div>
        ) : null}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Worker Number */}
            <div>
              <label
                htmlFor="party_worker_number"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
              >
                Worker Number *
              </label>
              <input
                type="text"
                id="party_worker_number"
                name="party_worker_number"
                value={formData.party_worker_number}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
                placeholder="e.g., PW010"
              />
            </div>

            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
              >
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
                placeholder="Enter full name"
              />
            </div>

            {/* Gender */}
            <div>
              <label
                htmlFor="gender"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
              >
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
              >
                <option value="">Select</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
              </select>
            </div>

            {/* DOB */}
            <div>
              <label
                htmlFor="dob"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
              >
                Date of Birth
              </label>
              <input
                type="date"
                id="dob"
                name="dob"
                value={formData.dob}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
              />
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="phone_number"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
              >
                Phone Number *
              </label>
              <input
                type="tel"
                id="phone_number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
                placeholder="10-digit phone number"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email_id"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
              >
                Email
              </label>
              <input
                type="email"
                id="email_id"
                name="email_id"
                value={formData.email_id}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
                placeholder="Email address"
              />
            </div>

            {/* Address */}
            <div className="lg:col-span-3">
              <label
                htmlFor="address"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
              >
                Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
                placeholder="Street, area"
              />
            </div>

            {/* Town/Village */}
            <div>
              <label
                htmlFor="town_village"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
              >
                Town / Village
              </label>
              <input
                type="text"
                id="town_village"
                name="town_village"
                value={formData.town_village}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
              />
            </div>

            {/* District */}
            <div>
              <label
                htmlFor="district"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
              >
                District
              </label>
              <input
                type="text"
                id="district"
                name="district"
                value={formData.district}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
              />
            </div>

            {/* State */}
            <div>
              <label
                htmlFor="state"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
              >
                State
              </label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
              />
            </div>

            {/* PIN Code */}
            <div>
              <label
                htmlFor="pin_code"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
              >
                PIN Code
              </label>
              <input
                type="text"
                id="pin_code"
                name="pin_code"
                value={formData.pin_code}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
              />
            </div>

            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
              >
                Username *
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
                placeholder="Enter username"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
              >
                Password *
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
                placeholder="Enter password"
              />
            </div>

            {/* Assembly */}
            <div>
              <label
                htmlFor="assembly_id"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
              >
                Assembly ID
              </label>
              <input
                type="number"
                id="assembly_id"
                name="assembly_id"
                value={formData.assembly_id}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
              />
            </div>

            {/* Booth Select from API (comes first) */}
            <div>
              <label
                htmlFor="booth_id"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
              >
                Booth *
              </label>
              <select
                id="booth_id"
                name="booth_id"
                value={formData.booth_id}
                onChange={handleBoothChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
              >
                <option value="">
                  {loadingBooths ? "Loading booths..." : "Select Booth"}
                </option>
                {booths.map((b, idx) => (
                  <option key={`${b.booth_id || idx}`} value={b.booth_id}>
                    Booth {b.booth_number} ({b.booth_type || "—"})
                  </option>
                ))}
              </select>
            </div>

            {/* Ward ID (auto-filled after selecting booth) */}
            <div>
              <label
                htmlFor="ward_id"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
              >
                Ward ID
              </label>
              <input
                type="number"
                id="ward_id"
                name="ward_id"
                value={formData.ward_id}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
                placeholder="Auto-filled after selecting booth"
              />
            </div>

            {/* Referred By */}
            <div>
              <label
                htmlFor="referred_by"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
              >
                Referred By
              </label>
              <input
                type="text"
                id="referred_by"
                name="referred_by"
                value={formData.referred_by}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
              />
            </div>

            {/* Joining Date */}
            <div>
              <label
                htmlFor="joining_date"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
              >
                Joining Date *
              </label>
              <input
                type="date"
                id="joining_date"
                name="joining_date"
                value={formData.joining_date}
                onChange={handleInputChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
              />
            </div>

            {/* (Removed Exit Date and Status as requested) */}
          </div>

          {/* Actions */}
          <div className="mt-8 flex justify-end space-x-3">
            <a
              href="/booth-workers"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
            >
              <span className="material-icons-outlined text-sm mr-1">
                cancel
              </span>
              Cancel
            </a>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-icons-outlined text-sm mr-1">
                {submitting
                  ? "hourglass_empty"
                  : isEditMode
                  ? "update"
                  : "save"}
              </span>
              {submitting
                ? "Adding..."
                : isEditMode
                ? "Update Worker"
                : "Add Worker"}
            </button>
          </div>
        </form>
      </div>

      {/* Toast Notification */}
      {toast.visible && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50">
          <div
            className={`px-6 py-3 rounded-lg shadow-lg text-white font-medium ${
              toast.type === "success"
                ? "bg-green-500"
                : toast.type === "error"
                ? "bg-red-500"
                : "bg-blue-500"
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
};

export default AddEditBoothWorkerPage;
