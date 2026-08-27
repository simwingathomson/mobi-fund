const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export type DashboardStats = {
  totalCustomers: number;
  activeLoans: number;
  pendingApplications: number;
  totalDisbursedAmount: number;
  totalRepayments: number;
  outstandingLoans: number;
};

async function getJson<T>(path: string, token?: string): Promise<T | null> {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      next: { revalidate: 15 }
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

export async function getDashboard(token?: string) {
  return getJson<DashboardStats>('/admin/dashboard', token);
}

export async function getCustomers(token?: string) {
  return getJson<any[]>('/admin/customers', token);
}

export async function getLoans(token?: string) {
  return getJson<any[]>('/admin/loans', token);
}

export async function getPayments(token?: string) {
  return getJson<any[]>('/admin/payments', token);
}
