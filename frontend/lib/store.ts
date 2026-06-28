export const saveToken = (token: string) => localStorage.setItem("interviewa_token", token);
export const getToken = () => localStorage.getItem("interviewa_token") || localStorage.getItem("token");
export const clearToken = () => {
  localStorage.removeItem("interviewa_token");
  localStorage.removeItem("token");
};
export const isLoggedIn = () => !!(localStorage.getItem("interviewa_token") || localStorage.getItem("token"));