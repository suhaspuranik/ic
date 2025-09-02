import apiClient, { DEFAULT_STAGE } from "../apiConfig";

export const getBoothWorkers = async (party_worker_id) => {
  const payload = {
    stage: DEFAULT_STAGE,
    party_worker_id: party_worker_id,
  };
  const response = await apiClient.post(
    "/iConnect_get_all_party_worker_details_web",
    payload
  );
  return response.data;
};

export const blockPartyWorker = async (party_worker_id) => {
  const payload = {
    stage: DEFAULT_STAGE,
    party_worker_id,
    status: "Block",
  };
  const response = await apiClient.post(
    "/iConnect_block_party_worker_web",
    payload
  );
  return response.data;
};

export const getBoothDetails = async () => {
  const roleName = sessionStorage.getItem("role_name");
  let payload = { stage: DEFAULT_STAGE };
  
  if (roleName === "Assembly Head") {
    const assemblyId = sessionStorage.getItem("assembly_id");
    payload.assembly_id = assemblyId;
  } else if (roleName === "Ward President") {
    const wardId = sessionStorage.getItem("ward_id");
    payload.ward_id = wardId;
  }
  
  const response = await apiClient.post(
    "/iConnect_get_booth_details_web",
    payload
  );
  return response.data;
};

export const reassignBoothToPartyWorker = async (booth_id, party_worker_id) => {
  const payload = {
    stage: DEFAULT_STAGE,
    booth_id: booth_id.toString(),
    party_worker_id: party_worker_id.toString(),
  };
  const response = await apiClient.post(
    "/iConnect_reassign_booth_to_party_worker_web",
    payload
  );
  return response.data;
};

export const createPartyWorker = async (workerData) => {
  const payload = {
    stage: DEFAULT_STAGE,
    party_worker_id: parseInt(workerData.party_worker_id) || 0,
    party_worker_number: workerData.party_worker_number,
    name: workerData.name,
    gender: workerData.gender,
    dob: workerData.dob,
    address: workerData.address,
    town_village: workerData.town_village,
    district: workerData.district,
    state: workerData.state,
    pin_code: workerData.pin_code,
    phone_number: workerData.phone_number,
    email_id: workerData.email_id,
    username: workerData.username,
    password: workerData.password,
    role_name: "Users",
    assembly_id: parseInt(workerData.assembly_id) || 0,
    ward_id: parseInt(workerData.ward_id) || 0,
    booth_id: parseInt(workerData.booth_id) || 0,
    referred_by: workerData.referred_by,
  };
  const response = await apiClient.post(
    "/iConnect_create_party_worker_web",
    payload
  );
  return response.data;
};