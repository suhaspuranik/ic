import apiClient, { DEFAULT_STAGE } from "../apiConfig";

/**
 * Create or save a survey (draft or publish) from web.
 * payload should include: party_worker_id, title, description, questions, status, booth_type, ward_id, booth_id, deadline
 */
export const iConnect_create_survey_web = async (surveyPayload) => {
  const validBoothTypes = ["Strong", "Weak", "Swing", "All"];
  const rawBoothType =
    surveyPayload.booth_type ||
    surveyPayload.targetBoothType ||
    surveyPayload.target_booth_type ||
    null;
  const boothType = rawBoothType
    ? validBoothTypes.find(
        (type) => type.toLowerCase() === rawBoothType.toLowerCase()
      ) || rawBoothType
    : null;
  const rawDeadline = surveyPayload.deadline || null;

  const payload = {
    stage: DEFAULT_STAGE,
    party_worker_id: String(
      surveyPayload.party_worker_id ||
        sessionStorage.getItem("party_worker_id") ||
        "0"
    ),
    title: surveyPayload.title || surveyPayload.name || "",
    description: surveyPayload.description || "",
    questions: surveyPayload.questions || [],
    status: surveyPayload.status || "Draft",
    booth_type: boothType,
    ward_id: surveyPayload.ward_id || surveyPayload.wardId || null,
    booth_id: surveyPayload.booth_id || surveyPayload.boothId || null,
    deadline: rawDeadline,
  };

  console.log(
    "iConnect_create_survey_web payload:",
    JSON.stringify(payload, null, 2)
  );
  console.log("Raw booth_type value:", rawBoothType);
  console.log("Normalized booth_type:", boothType);
  console.log("Raw deadline value:", rawDeadline);
  console.log(
    "deadline format validation:",
    rawDeadline
      ? /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(rawDeadline)
      : "null"
  );
  const response = await apiClient.post("/iConnect_create_survey_web", payload);
  console.log(
    "iConnect_create_survey_web response:",
    JSON.stringify(response.data, null, 2)
  );
  return response.data;
};

/**
 * Fetch survey details for web dashboard.
 * Returns an array of surveys. Backend is expected to return an array under response.data or response.data.items.
 */
export const iConnect_get_survey_details_web = async (query = {}) => {
  const payload = {
    stage: DEFAULT_STAGE,
    party_worker_id: String(
      query.party_worker_id || sessionStorage.getItem("party_worker_id") || "0"
    ),
    ...query,
  };

  const response = await apiClient.post(
    "/iConnect_get_survey_details_web",
    payload
  );
  const data = response.data;
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  for (const key of Object.keys(data)) {
    if (Array.isArray(data[key])) return data[key];
  }
  return [];
};

/**
 * Update expired surveys in the database.
 * payload: { survey_ids: number[], party_worker_id: string }
 */
export const iConnect_update_expired_surveys_web = async (payload = {}) => {
  const surveyIds = Array.isArray(payload.survey_ids)
    ? payload.survey_ids
        .map((id) => Number(id))
        .filter((id) => !isNaN(id) && id !== null && id !== "")
    : [];

  if (surveyIds.length === 0) {
    console.warn(
      "No valid survey IDs provided to iConnect_update_expired_surveys_web"
    );
    return [];
  }

  const results = [];
  for (const surveyId of surveyIds) {
    const requestPayload = {
      stage: DEFAULT_STAGE,
      party_worker_id: String(
        payload.party_worker_id ||
          sessionStorage.getItem("party_worker_id") ||
          "0"
      ),
      survey_id: surveyId,
    };

    console.log(
      "iConnect_update_expired_surveys_web payload for survey_id:",
      surveyId,
      requestPayload
    );
    try {
      const response = await apiClient.post(
        "/iConnect_update_expired_surveys_web",
        requestPayload
      );
      console.log(
        "iConnect_update_expired_surveys_web response for survey_id:",
        surveyId,
        response.data
      );
      const data = response.data;
      if (data) {
        if (Array.isArray(data)) results.push(...data);
        else if (Array.isArray(data.items)) results.push(...data.items);
        else if (Array.isArray(data.RESULT)) results.push(...data.RESULT);
        else results.push(data);
      }
    } catch (err) {
      console.error(
        `Failed to update survey_id ${surveyId}:`,
        err.response?.data || err.message
      );
    }
  }

  return results;
};

/**
 * Get all wards available for a party worker
 * query: { party_worker_id }
 */
export const iConnect_get_all_wards_web = async (query = {}) => {
  const payload = {
    stage: DEFAULT_STAGE,
    party_worker_id: String(
      query.party_worker_id || sessionStorage.getItem("party_worker_id") || "0"
    ),
    ...query,
  };

  const response = await apiClient.post("/iConnect_get_all_wards_web", payload);
  const data = response.data;
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.wards)) return data.wards;
  for (const key of Object.keys(data)) {
    if (Array.isArray(data[key])) return data[key];
  }
  return [];
};

/**
 * Get all booths for a ward
 * query: { ward_id }
 */
export const iConnect_get_all_booths_web = async (query = {}) => {
  const payload = {
    stage: DEFAULT_STAGE,
    ward_id: String(query.ward_id || query.wardId || ""),
    ...query,
  };

  const response = await apiClient.post(
    "/iConnect_get_all_booths_web",
    payload
  );
  const data = response.data;
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.booths)) return data.booths;
  for (const key of Object.keys(data)) {
    if (Array.isArray(data[key])) return data[key];
  }
  return [];
};
