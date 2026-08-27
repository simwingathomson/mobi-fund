const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

export type Session = {
  accessToken: string;
  user: { id: string; name: string; email: string; role: string };
};

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {})
    }
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export const api = {
  login(email: string, password: string) {
    return request<Session>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  },
  register(payload: Record<string, string>) {
    return request<Session>('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
  },
  products(token: string) {
    return request<any[]>('/loans/products', {}, token);
  },
  profile(token: string) {
    return request<any>('/customer/profile', {}, token);
  },
  apply(token: string, loanProductId: string, amount: number) {
    return request<any>('/loans/apply', { method: 'POST', body: JSON.stringify({ loanProductId, amount }) }, token);
  },
  collectPayment(token: string, loanId: string, amount: number, transactionReference: string) {
    return request<any>('/payments/collect', { method: 'POST', body: JSON.stringify({ loanId, amount, paymentMethod: 'Manual transfer', transactionReference }) }, token);
  }
};
