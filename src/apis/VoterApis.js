import apiClient, { DEFAULT_STAGE } from "../apiConfig";

export const getAllVoterS3Url = async (party_worker_id) => {
  const payload = {
    stage: DEFAULT_STAGE,
    party_worker_id: String(party_worker_id || "1"),
  };
  const response = await apiClient.post(
    "/iConnect_get_all_voter_detailsV2_web",
    payload
  );
  return response.data; // expected to include { s3_url }
};

export const getOtherVoterDetails = async (identifier) => {
  const payload = {
    stage: DEFAULT_STAGE,
    // Backend now accepts voter_id; fallback to epic_number if needed
    voter_id: String(identifier),
  };
  const response = await apiClient.post(
    "/iConnect_get_other_voter_details_web",
    payload
  );
  return response.data;
};


