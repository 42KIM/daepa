const TOKEN_KEY = "accessToken";

export const tokenStorage = {
  async setToken(token: string): Promise<void> {
    localStorage.setItem(TOKEN_KEY, token);
  },
  async getToken(): Promise<string | null> {
    return localStorage.getItem(TOKEN_KEY);
  },
  async removeToken(): Promise<void> {
    localStorage.removeItem(TOKEN_KEY);
  },
};
