import { getCustomers, getDashboard, getLoans, getPayments } from './api';

const fallbackStats = {
  totalCustomers: 1284,
  activeLoans: 438,
  pendingApplications: 57,
  totalDisbursedAmount: 2800000,
  totalRepayments: 1900000,
  outstandingLoans: 840000
};

const fallbackCustomers = [
  { user: { name: 'Demo Customer', phone: '+260970000002' }, verificationStatus: 'PENDING', loans: [] },
  { user: { name: 'Grace Mumba', phone: '+260976442110' }, verificationStatus: 'APPROVED', loans: [{ totalRepayment: 3200 }] },
  { user: { name: 'Kelvin Phiri', phone: '+260977123210' }, verificationStatus: 'REJECTED', loans: [] }
];

const fallbackLoans = [
  { loanProduct: { name: 'Starter Loan' }, customer: { user: { name: 'Demo Customer' } }, amount: 500, status: 'PENDING' },
  { loanProduct: { name: 'Business Boost' }, customer: { user: { name: 'Grace Mumba' } }, amount: 3200, status: 'ACTIVE' },
  { loanProduct: { name: 'Starter Loan' }, customer: { user: { name: 'Kelvin Phiri' } }, amount: 800, status: 'REJECTED' }
];

const fallbackPayments = [
  { transactionReference: 'MF-COL-10021', paymentMethod: 'manual payments', amount: 450, status: 'CONFIRMED' },
  { transactionReference: 'MF-COL-10022', paymentMethod: 'manual payments', amount: 120, status: 'PENDING' }
];

export default async function Page() {
  const [dashboard, customers, loans, payments] = await Promise.all([
    getDashboard(),
    getCustomers(),
    getLoans(),
    getPayments()
  ]);
  const stats = dashboard ?? fallbackStats;
  const customerRows = (customers?.length ? customers : fallbackCustomers).map(customer => [
    customer.user?.name ?? 'Unknown',
    customer.user?.phone ?? '-',
    customer.verificationStatus ?? 'PENDING',
    money((customer.loans ?? []).reduce((sum: number, loan: any) => sum + Number(loan.totalRepayment ?? 0), 0))
  ]);
  const loanRows = (loans?.length ? loans : fallbackLoans).map(loan => [
    loan.loanProduct?.name ?? 'Loan',
    loan.customer?.user?.name ?? 'Customer',
    money(Number(loan.amount ?? 0)),
    loan.status
  ]);
  const paymentRows = (payments?.length ? payments : fallbackPayments).map(payment => [
    payment.transactionReference,
    payment.paymentMethod,
    money(Number(payment.amount ?? 0)),
    payment.status
  ]);

  return (
    <main className="min-h-screen">
      <aside className="fixed hidden h-full w-64 border-r border-slate-200 bg-white p-6 lg:block">
        <h1 className="text-2xl font-black text-fund-green">MobiFund</h1>
        <nav className="mt-10 grid gap-2 text-sm font-semibold text-slate-600">
          {['Dashboard', 'Customers', 'Loans', 'Loan Products', 'Payments', 'Reports'].map(item => <a key={item} className="rounded-md px-3 py-2 hover:bg-fund-mist">{item}</a>)}
        </nav>
      </aside>

      <section className="lg:pl-64">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
          <div>
            <p className="text-sm font-semibold text-fund-green">Admin dashboard</p>
            <h2 className="text-2xl font-black">Loan operations</h2>
          </div>
          <button className="rounded-md bg-fund-green px-4 py-2 text-sm font-bold text-white">New product</button>
        </header>

        <div className="grid gap-6 p-5">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <Stat label="Total customers" value={stats.totalCustomers} />
            <Stat label="Active loans" value={stats.activeLoans} />
            <Stat label="Pending applications" value={stats.pendingApplications} />
            <Stat label="Disbursed" value={money(stats.totalDisbursedAmount)} />
            <Stat label="Repayments" value={money(stats.totalRepayments)} />
            <Stat label="Outstanding" value={money(stats.outstandingLoans)} />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <Panel title="Customer management" action="Search">
              <Table headers={['Customer', 'Phone', 'KYC', 'Outstanding']} rows={customerRows} />
            </Panel>
            <Panel title="Reports">
              <div className="grid gap-3">
                {['Customer report', 'Loan report', 'Payment report', 'Outstanding balances'].map(item => <button key={item} className="rounded-md border border-slate-200 px-4 py-3 text-left font-semibold hover:border-fund-green">{item}</button>)}
              </div>
            </Panel>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <Panel title="Loan applications" action="Review queue">
              <Table headers={['Product', 'Customer', 'Amount', 'Status']} rows={loanRows} />
            </Panel>
            <Panel title="Payments">
              <Table headers={['Reference', 'Method', 'Amount', 'Status']} rows={paymentRows} />
            </Panel>
          </section>

          <Panel title="Loan products">
            <div className="grid gap-4 md:grid-cols-2">
              {['Starter Loan: K100-K1,000, 12%, 30 days, K15 fee', 'Business Boost: K1,000-K10,000, 18%, 90 days, K75 fee'].map(item => <div key={item} className="rounded-lg border border-slate-200 bg-fund-mist p-4 font-semibold">{item}</div>)}
            </div>
          </Panel>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-xs font-bold uppercase text-slate-500">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div>;
}

function money(value: number) {
  return `K${new Intl.NumberFormat('en-ZM', { maximumFractionDigits: 0 }).format(value)}`;
}

function Panel({ title, action, children }: { title: string; action?: string; children: React.ReactNode }) {
  return <section className="rounded-lg border border-slate-200 bg-white p-5"><div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-black">{title}</h3>{action && <button className="rounded-md border border-slate-300 px-3 py-2 text-sm font-bold">{action}</button>}</div>{children}</section>;
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-slate-200 text-xs uppercase text-slate-500">{headers.map(h => <th key={h} className="py-3 pr-4">{h}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.join('-')} className="border-b border-slate-100">{row.map(cell => <td key={cell} className="py-3 pr-4 font-medium">{cell}</td>)}</tr>)}</tbody></table></div>;
}
