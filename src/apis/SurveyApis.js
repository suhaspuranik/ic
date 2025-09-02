import apiClient, { DEFAULT_STAGE } from "../apiConfig";

/**
 * Create or save a survey (draft or publish) from web.
 * payload should include: party_worker_id, title, description, questions, status, target_booth_type, ward_id, booth_id, due_date
 */
export const iConnect_create_survey_web = async (surveyPayload) => {
    const payload = {
        stage: DEFAULT_STAGE,
        party_worker_id: String(surveyPayload.party_worker_id || sessionStorage.getItem("party_worker_id") || "0"),
        title: surveyPayload.title || surveyPayload.name || "",
        description: surveyPayload.description || "",
        questions: surveyPayload.questions || [],
        status: surveyPayload.status || "Draft",
        target_booth_type: surveyPayload.target_booth_type || surveyPayload.targetBoothType || null,
        ward_id: surveyPayload.ward_id || surveyPayload.wardId || null,
        booth_id: surveyPayload.booth_id || surveyPayload.boothId || null,
        due_date: surveyPayload.due_date || surveyPayload.deadline || null,
    };

    console.log("iConnect_create_survey_web payload:", payload);
    const response = await apiClient.post("/iConnect_create_survey_web", payload);
    return response.data;
};

/**
 * Fetch survey details for web dashboard.
 * Returns an array of surveys. Backend is expected to return an array under response.data or response.data.items.
 */
export const iConnect_get_survey_details_web = async (query = {}) => {
    const payload = {
        stage: DEFAULT_STAGE,
        party_worker_id: String(query.party_worker_id || sessionStorage.getItem("party_worker_id") || "0"),
        ...query,
    };

    const response = await apiClient.post("/iConnect_get_survey_details_web", payload);
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
        ? payload.survey_ids.map(id => Number(id)).filter(id => !isNaN(id) && id !== null && id !== "")
        : (payload.survey_id != null ? [Number(payload.survey_id)] : []);

    if (surveyIds.length === 0) {
        console.warn("No valid survey IDs provided to iConnect_update_expired_surveys_web");
        return [];
    }

    const requestPayload = {
        stage: DEFAULT_STAGE,
        party_worker_id: String(payload.party_worker_id || sessionStorage.getItem("party_worker_id") || "0"),
        survey_ids: surveyIds,
    };

    console.log("iConnect_update_expired_surveys_web batch payload:", requestPayload);
    const response = await apiClient.post("/iConnect_update_expired_surveys_web", requestPayload);
    console.log("iConnect_update_expired_surveys_web batch response:", response.data);
    const data = response.data;
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.RESULT)) return data.RESULT;
    return [data];
};

/**
 * Get all wards available for a party worker
 * query: { party_worker_id }
 */
export const iConnect_get_all_wards_web = async (query = {}) => {
    const payload = {
        stage: DEFAULT_STAGE,
        party_worker_id: String(query.party_worker_id || sessionStorage.getItem("party_worker_id") || "0"),
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

    const response = await apiClient.post("/iConnect_get_all_booths_web", payload);
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