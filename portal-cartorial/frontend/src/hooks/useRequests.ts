/**
 * useRequests.ts — Custom Hook para listagem e criação de pedidos
 * C3 Component: Hooks (estado e queries)
 */
'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { requestsApi } from '../services/api';

// ── Listar pedidos paginados ──────────────────────────────────────────────
export function useRequests(page = 1, limit = 10) {
  return useQuery({
    queryKey: ['requests', page, limit],
    queryFn: async () => {
      const res = await requestsApi.findAll(page, limit);
      return res.data as { data: any[]; total: number; page: number };
    },
    placeholderData: (prev) => prev,
  });
}

// ── Buscar um pedido por ID ───────────────────────────────────────────────
export function useRequest(id: string) {
  return useQuery({
    queryKey: ['requests', id],
    queryFn: async () => {
      const res = await requestsApi.findOne(id);
      return res.data;
    },
    enabled: !!id,
  });
}

// ── Criar novo pedido ─────────────────────────────────────────────────────
export function useCreateRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      documentType: string;
      notes?: string;
      metadata?: Record<string, any>;
    }) => requestsApi.create(data).then((r) => r.data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
  });
}

// ── Atualizar status do pedido (atendente) ───────────────────────────────
export function useUpdateRequestStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      requestsApi.updateStatus(id, status).then((r) => r.data),

    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['requests', id] });
    },
  });
}
