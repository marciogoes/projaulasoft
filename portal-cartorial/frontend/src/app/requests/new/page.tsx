'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

// ── Tipos de documento disponíveis ────────────────────────────────────────
const DOCUMENT_TYPES = [
  { value: 'CERTIDAO_NASCIMENTO',    label: 'Certidão de Nascimento',    price: 45.90, days: 3 },
  { value: 'CERTIDAO_CASAMENTO',     label: 'Certidão de Casamento',     price: 45.90, days: 3 },
  { value: 'CERTIDAO_OBITO',         label: 'Certidão de Óbito',         price: 45.90, days: 3 },
  { value: 'RECONHECIMENTO_FIRMA',   label: 'Reconhecimento de Firma',   price: 25.50, days: 1 },
  { value: 'AUTENTICACAO_DOCUMENTO', label: 'Autenticação de Documento', price: 18.00, days: 1 },
  { value: 'PROCURACAO',             label: 'Procuração',                price: 75.00, days: 2 },
];

// ── Schema de validação (Zod) ─────────────────────────────────────────────
const newRequestSchema = z.object({
  documentType: z.string({ required_error: 'Selecione o tipo de serviço' }).min(1),
  notes: z.string().max(500).optional(),
});

type NewRequestFormData = z.infer<typeof newRequestSchema>;

export default function NewRequestPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<NewRequestFormData>({ resolver: zodResolver(newRequestSchema) });

  const selectedType = watch('documentType');
  const selectedInfo = DOCUMENT_TYPES.find((d) => d.value === selectedType);

  const onSubmit = async (data: NewRequestFormData) => {
    setLoading(true);
    setApiError(null);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/requests`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${(session as any)?.accessToken}`,
          },
          body: JSON.stringify(data),
        },
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message ?? 'Erro ao criar solicitação');
      }

      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (e: any) {
      setApiError(e.message ?? 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="card p-8 max-w-sm text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Pedido criado!</h2>
          <p className="text-slate-500 text-sm">Redirecionando para o dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 text-sm">
            ← Dashboard
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-sm text-slate-700 font-medium">Nova solicitação</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Nova solicitação cartorial</h1>
        <p className="text-slate-500 text-sm mb-8">
          Preencha os dados abaixo para solicitar um serviço cartorial digital.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Formulário */}
          <div className="md:col-span-2">
            <div className="card p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Tipo de documento */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Tipo de serviço <span className="text-red-500">*</span>
                  </label>
                  <select {...register('documentType')} className="input-base">
                    <option value="">Selecione o serviço...</option>
                    {DOCUMENT_TYPES.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label} — R$ {d.price.toFixed(2)}
                      </option>
                    ))}
                  </select>
                  {errors.documentType && (
                    <p className="text-red-500 text-xs mt-1">{errors.documentType.message}</p>
                  )}
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Observações (opcional)
                  </label>
                  <textarea
                    {...register('notes')}
                    placeholder="Informações adicionais para o atendente..."
                    rows={3}
                    className="input-base resize-none"
                  />
                  {errors.notes && (
                    <p className="text-red-500 text-xs mt-1">{errors.notes.message}</p>
                  )}
                </div>

                {apiError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    {apiError}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Link
                    href="/dashboard"
                    className="flex-1 text-center py-2.5 px-5 border border-slate-300 hover:border-slate-400 rounded-xl text-sm font-medium text-slate-700 transition-colors"
                  >
                    Cancelar
                  </Link>
                  <button
                    type="submit"
                    disabled={loading || !selectedType}
                    className="flex-1 btn-primary flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        Enviando...
                      </>
                    ) : (
                      'Criar solicitação'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Resumo do pedido */}
          <div>
            <div className="card p-5 sticky top-20">
              <h3 className="font-semibold text-slate-800 mb-4 text-sm">Resumo do pedido</h3>
              {selectedInfo ? (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Serviço</span>
                    <span className="font-medium text-slate-800 text-right max-w-[120px]">
                      {selectedInfo.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Prazo</span>
                    <span className="font-medium text-slate-800">{selectedInfo.days} dia(s)</span>
                  </div>
                  <div className="border-t border-slate-200 pt-3 flex justify-between">
                    <span className="font-semibold text-slate-800">Total</span>
                    <span className="font-bold text-teal-600 text-base">
                      R$ {selectedInfo.price.toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-slate-400 text-sm">Selecione um serviço para ver o resumo.</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
