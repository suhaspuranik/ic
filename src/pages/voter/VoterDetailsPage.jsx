import React, { useEffect, useMemo, useState, useRef } from "react";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import {
  initDB,
  addBatchToDB,
  getVotersByPage,
  clearVotersStore,
  getVotersCount,
} from "../../utils/indexedDB";
import { getAllVoterS3Url, getOtherVoterDetails } from "../../apis/VoterApis";

const VoterDetailsPage = () => {
  // DB and pagination state
  const [db, setDb] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageVoters, setPageVoters] = useState([]);
  const itemsPerPage = 50;
  const [loading, setLoading] = useState(true);

  // Ref to prevent double API calls
  const isInitializing = useRef(false);

  // Pagination and filtering states (applied to current page only)
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGender, setFilterGender] = useState("All");
  const [filterReligion, setFilterReligion] = useState("All");
  const [selectedVoter, setSelectedVoter] = useState(null);
  const [showVoterModal, setShowVoterModal] = useState(false);
  const [voterDetails, setVoterDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Get unique values for filter dropdowns
  const genders = [
    ...new Set(pageVoters.map((voter) => voter.gender).filter(Boolean)),
  ];
  const religions = [
    ...new Set(pageVoters.map((voter) => voter.religion).filter(Boolean)),
  ];

  // Filter voters based on search and filter criteria
  const filteredVoters = useMemo(() => {
    return pageVoters.filter((voter) => {
      const fullName = (
        voter.voter_full_name ||
        `${voter.voter_first_middle_name || ""} ${voter.voter_last_name || ""}`
      ).trim();

      // Enhanced search functionality - search by Voter ID, EPIC Number, or Name (partial matches)
      const matchesSearch =
        searchTerm === "" ||
        fullName.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        (voter.epic_number || "")
          .toString()
          .toLowerCase()
          .includes(searchTerm.toLowerCase().trim()) ||
        false ||
        // Also search by parts of name (first name, last name separately)
        fullName
          .toLowerCase()
          .split(" ")
          .some((namePart) =>
            namePart.includes(searchTerm.toLowerCase().trim())
          );

      const matchesGender =
        filterGender === "All" || voter.gender === filterGender;
      const matchesReligion =
        filterReligion === "All" || voter.religion === filterReligion;

      return matchesSearch && matchesGender && matchesReligion;
    });
  }, [pageVoters, searchTerm, filterGender, filterReligion]);

  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

  useEffect(() => {
    const bootstrap = async () => {
      // Prevent double initialization
      if (isInitializing.current) {
        console.log("Bootstrap already in progress, skipping...");
        return;
      }

      isInitializing.current = true;
      console.log("Starting bootstrap process...");

      setLoading(true);
      const dbInstance = await initDB();
      setDb(dbInstance);
      // Clear existing store before new ingest
      await clearVotersStore(dbInstance);

      const partyWorkerId = sessionStorage.getItem("party_worker_id") || "1";
      // Get S3 URL from backend
      const { s3_url } = await getAllVoterS3Url(partyWorkerId);
      if (!s3_url) {
        setLoading(false);
        isInitializing.current = false;
        return;
      }

      const res = await fetch(s3_url);
      const voterData = await res.json();

      const worker = new Worker(
        new URL("../../workers/voterWorker.js", import.meta.url)
      );
      worker.postMessage(voterData);
      worker.onmessage = async (event) => {
        if (event.data.type === "STORE_BATCH") {
          await addBatchToDB(dbInstance, event.data.data);
        }
        if (event.data.type === "DONE") {
          const count = await getVotersCount(dbInstance);
          setTotalCount(count);
          const firstPage = await getVotersByPage(dbInstance, 1, itemsPerPage);
          setPageVoters(firstPage);
          setCurrentPage(1);
          setLoading(false);
          isInitializing.current = false;
          console.log("Bootstrap process completed!");
        }
      };
    };
    bootstrap();
  }, []);

  // Modal functions
  const openVoterModal = async (voter) => {
    setSelectedVoter(voter);
    setShowVoterModal(true);
    setVoterDetails(null);
    setLoadingDetails(true);

    try {
      const response = await getOtherVoterDetails(
        voter.voter_id || voter.epic_number
      );
      if (response.RESULT && response.RESULT.length > 0) {
        setVoterDetails(response.RESULT[0]);
      }
    } catch (error) {
      console.error("Error fetching voter details:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeVoterModal = () => {
    setSelectedVoter(null);
    setShowVoterModal(false);
    setVoterDetails(null);
    setLoadingDetails(false);
  };

  // Calculate pagination display indexes
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalCount);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterGender, filterReligion]);

  const handlePageChange = async (page) => {
    if (!db) return;
    const newPage = Math.max(1, Math.min(totalPages, page));
    const data = await getVotersByPage(db, newPage, itemsPerPage);
    setPageVoters(data);
    setCurrentPage(newPage);
  };

  return (
    <div className="relative space-y-6">
      {loading && (
        <div className="sticky top-0 z-10">
          <div className="mb-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 flex items-center gap-2">
            <LoadingSpinner size="small" color="blue" />
            <span className="text-blue-700 text-sm font-medium">
              Loading voter data…
            </span>
          </div>
        </div>
      )}
      {/* Page Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <span className="material-icons-outlined text-blue-600">
                how_to_vote
              </span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-[var(--text-secondary)]">
                Total Voters
              </p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {totalCount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <span className="material-icons-outlined text-green-600">wc</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-[var(--text-secondary)]">
                Genders
              </p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {genders.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <span className="material-icons-outlined text-purple-600">
                diversity_3
              </span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-[var(--text-secondary)]">
                Religions
              </p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {religions.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100">
              <span className="material-icons-outlined text-orange-600">
                filter_list
              </span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-[var(--text-secondary)]">
                Filtered Results
              </p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {filteredVoters.length.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Search Voters
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 material-icons-outlined text-[var(--text-secondary)] text-lg pointer-events-none">
                search
              </span>
              <input
                type="text"
                placeholder="Search by Voter ID, EPIC Number, or Name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 h-10"
              />
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Supports partial matches for names and IDs
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Gender
            </label>
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
            >
              <option value="All">All Genders</option>
              {genders.map((gender) => (
                <option key={gender} value={gender}>
                  {gender}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Religion
            </label>
            <select
              value={filterReligion}
              onChange={(e) => setFilterReligion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
            >
              <option value="All">All Religions</option>
              {religions.map((religion) => (
                <option key={religion} value={religion}>
                  {religion}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Actions
            </label>
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterWardId("All");
                setFilterReligion("All");
              }}
              className="width-full px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 active:bg-orange-700 transition-colors duration-200 flex items-center justify-center gap-1.5 whitespace-nowrap shadow-sm hover:shadow-md"
            >
              <span className="material-icons-outlined text-sm">clear_all</span>
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Voters Table */}
      <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Voter Details
          </h2>
          <div className="text-sm text-[var(--text-secondary)]">
            Showing {startIndex + 1}-{startIndex + filteredVoters.length} of{" "}
            {totalCount} voters
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  EPIC Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  Gender
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  Age
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  Religion
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  Relation Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  Relation Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  House Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVoters.length > 0 ? (
                filteredVoters.map((voter) => (
                  <tr
                    key={voter.voter_id || voter.epic_number}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--text-primary)]">
                      {voter.epic_number || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--text-primary)]">
                      {(voter.voter_full_name || "").trim() ||
                        `${(voter.voter_first_middle_name || "").trim()} ${(
                          voter.voter_last_name || ""
                        ).trim()}`.trim()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                      {voter.gender || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                      {voter.age ?? "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                      {voter.religion || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                      {voter.relation_full_name || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                      {voter.relation_type || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                      {voter.house_number || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                      <button
                        onClick={() => openVoterModal(voter)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View More
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <span className="material-icons-outlined text-4xl text-gray-400 mb-2">
                        search_off
                      </span>
                      <p className="text-sm text-[var(--text-secondary)]">
                        No voters found matching your search criteria
                      </p>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        Try searching by Voter ID, EPIC Number, or Name
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-6">
            <div className="flex-1 flex justify-between items-center">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">
                  Page <span className="font-medium">{currentPage}</span> of{" "}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    currentPage === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  First
                </button>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    currentPage === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Previous
                </button>

                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        currentPage === pageNum
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    currentPage === totalPages
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Next
                </button>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    currentPage === totalPages
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Last
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Voter Details Modal */}
      {showVoterModal && selectedVoter && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div
            className="bg-[var(--bg-card)] rounded-xl shadow-lg border border-slate-200 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative z-10"
            style={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)" }}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                  Voter Details -{" "}
                  {selectedVoter.voter_full_name ||
                    `${selectedVoter.voter_first_middle_name || ""} ${
                      selectedVoter.voter_last_name || ""
                    }`.trim()}
                </h2>
                <button
                  onClick={closeVoterModal}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <span className="material-icons-outlined">close</span>
                </button>
              </div>

              {loadingDetails ? (
                <div className="text-center py-8">
                  <LoadingSpinner size="small" color="blue" />
                  <p className="text-[var(--text-secondary)] mt-2">
                    Loading additional details...
                  </p>
                </div>
              ) : voterDetails ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <label className="text-sm font-medium text-[var(--text-secondary)]">
                        Date of Birth
                      </label>
                      <p className="text-[var(--text-primary)] font-semibold">
                        {voterDetails.dob || "—"}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <label className="text-sm font-medium text-[var(--text-secondary)]">
                        Booth ID
                      </label>
                      <p className="text-[var(--text-primary)] font-semibold">
                        {voterDetails.booth_id || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <label className="text-sm font-medium text-[var(--text-secondary)]">
                        Ward ID
                      </label>
                      <p className="text-[var(--text-primary)] font-semibold">
                        {voterDetails.ward_id || "—"}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <label className="text-sm font-medium text-[var(--text-secondary)]">
                        Assembly ID
                      </label>
                      <p className="text-[var(--text-primary)] font-semibold">
                        {voterDetails.assembly_id || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <label className="text-sm font-medium text-[var(--text-secondary)]">
                        Section Number
                      </label>
                      <p className="text-[var(--text-primary)] font-semibold">
                        {voterDetails.section_number || "—"}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <label className="text-sm font-medium text-[var(--text-secondary)]">
                        District
                      </label>
                      <p className="text-[var(--text-primary)] font-semibold">
                        {voterDetails.district || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <label className="text-sm font-medium text-[var(--text-secondary)]">
                        State
                      </label>
                      <p className="text-[var(--text-primary)] font-semibold">
                        {voterDetails.state || "—"}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <label className="text-sm font-medium text-[var(--text-secondary)]">
                        PIN Code
                      </label>
                      <p className="text-[var(--text-primary)] font-semibold">
                        {voterDetails.pin_code || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <label className="text-sm font-medium text-[var(--text-secondary)]">
                      Address
                    </label>
                    <p className="text-[var(--text-primary)] font-semibold">
                      {[
                        voterDetails.address_line_1,
                        voterDetails.address_line_2,
                      ]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-[var(--text-secondary)]">
                    Unable to load additional details.
                  </p>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeVoterModal}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoterDetailsPage;
