import apiClient, { DEFAULT_STAGE } from "../apiConfig";

export const loginUser = async (email, password, role) => {
  const payload = {
    stage: DEFAULT_STAGE,
    username: email,
    password,
    role_name: role,
  };
  const response = await apiClient.post("/iConnect_login_web", payload);
  return response.data;
};
