import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard' };

// ── Tipos do domínio ───────────────────────────────────────────────────────
type RequestStatus =
  | 'PENDING' | 'PAID' | 'PROCESSING' | 'READY' | 'DELIVERED'
  | 'CANCELLED' | 'REJECTED';

interface ServiceRequest {
  id: string;
  documentType: string;
  status: RequestStatus;
  amount: number;
  createdAt: string;
}

// ── Helpers visuais ────────────────────────────────────────────────────────
const STATUS_LABELS: Record<RequestStatus, string> = {
  PENDING:    'Aguardando pagamento',
  PAID:       'Pago',
  PROCESSING: 'Em processamento',
  READY:      'Pronto para retirada',
  DELIVERED:  'Entregue',
  CANCELLED:  'Cancelado',
  REJECTED:   'Rejeitado',
};

const STATUS_COLORS: Record<RequestStatus, string> = {
  PENDING:    'bg-yellow-100 text-yellow-800',
  PAID:       'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-purple-100 text-purple-800',
  READY:      'bg-teal-100 text-teal-800',
  DELIVERED:  'bg-green-100 text-green-800',
  CANCELLED:  'bg-slate-100 text-slate-500',
  REJECTED:   'bg-red-100 text-red-800',
};

const DOC_NAMES: Record<string, string> = {
  CERTIDAO_NASCIMENTO:    'Certidão de Nascimento',
  CERTIDAO_CASAMENTO:     'Certidão de Casamento',
  CERTIDAO_OBITO:         'Certidão de Óbito',
  RECONHECIMENTO_FIRMA:   'Reconhecimento de Firma',
  AUTENTICACAO_DOCUMENTO: 'Autenticação de Documento',
  PROCURACAO:             'Procuração',
};

// ── Dados mock (substituir por fetch à API em produção) ───────────────────
const MOCK_REQUESTS: ServiceRequest[] = [
  { id: 'req-001', documentType: 'CERTIDAO_NASCIMENTO',  status: 'READY',      amount: 45.90, createdAt: '2026-03-01' },
  { id: 'req-002', documentType: 'RECONHECIMENTO_FIRMA', status: 'PROCESSING', amount: 25.50, createdAt: '2026-03-03' },
  { id: 'req-003', documentType: 'PROCURACAO',           status: 'PENDING',    amount: 75.00, createdAt: '2026-03-05' },
];

// ── Componentes ──────────────────────────────────────────────────────────
function StatCard({ icon, label, value, colorClass }: {
  icon: string; label: string; value: string | number; colorClass: string;
}) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 flex items-center justify-center rounded-xl text-xl ${colorClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function RequestRow({ request }: { request: ServiceRequest }) {
  const statusClass = STATUS_COLORS[request.status] ?? 'bg-slate-100 text-slate-600';
  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-6 py-4 text-sm font-mono text-slate-500">#{request.id.slice(-6)}</td>
      <td className="px-6 py-4 text-sm font-medium text-slate-800">
        {DOC_NAMES[request.documentType] ?? request.documentType}
      </td>
      <td className="px-6 py-4">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusClass}`}>
          {STATUS_LABELS[request.status]}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-slate-600">
        {new Date(request.createdAt).toLocaleDateString('pt-BR')}
      </td>
      <td className="px-6 py-4 text-sm font-semibold text-slate-800">
        R$ {request.amount.toFixed(2)}
      </td>
      <td className="px-6 py-4">
        <Link
          href={`/requests/${request.id}`}
          className="text-teal-600 hover:text-teal-700 text-sm font-medium"
        >
          Ver detalhes →
        </Link>
      </td>
    </tr>
  );
}

// ── Página (Server Component com autenticação) ────────────────────────────
export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session) redirect('/auth/login');

  const total    = MOCK_REQUESTS.length;
  const pending  = MOCK_REQUESTS.filter(r => r.status === 'PENDING').length;
  const ready    = MOCK_REQUESTS.filter(r => r.status === 'READY').length;
  const totalSpent = MOCK_REQUESTS.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚖️</span>
            <span className="font-bold text-slate-900">Portal Cartorial</span>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <span className="text-slate-500">Olá, cidadão</span>
            <Link
              href="/requests/new"
              className="btn-primary"
            >
              + Nova solicitação
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-6">Meus pedidos</h1>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon="📋" label="Total de pedidos"  value={total}     colorClass="bg-slate-100" />
            <StatCard icon="⏳" label="Aguardando"        value={pending}   colorClass="bg-yellow-100" />
            <StatCard icon="✅" label="Prontos"            value={ready}     colorClass="bg-teal-100" />
            <StatCard icon="💰" label="Total gasto"       value={`R$ ${totalSpent.toFixed(2)}`} colorClass="bg-blue-100" />
          </div>
        </div>

        {/* Tabela de pedidos */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Histórico de solicitações</h2>
            <Link href="/requests/new" className="text-teal-600 text-sm hover:underline">
              + Nova solicitação
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 text-left">ID</th>
                  <th className="px-6 py-3 text-left">Serviço</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Data</th>
                  <th className="px-6 py-3 text-left">Valor</th>
                  <th className="px-6 py-3 text-left">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {MOCK_REQUESTS.map((r) => (
                  <RequestRow key={r.id} request={r} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
