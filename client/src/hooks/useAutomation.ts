import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { automationService, type AutomationRule, type CreateAutomationData, type UpdateAutomationData } from '@/services/automation.service';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export function useAutomation() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: rules = [],
    isLoading,
    error,
    refetch,
  } = useQuery<AutomationRule[]>({
    queryKey: ['automation', 'rules'],
    queryFn: automationService.getAllRules,
    enabled: isAuthenticated,
  });

  const {
    data: activeRules = [],
    isLoading: isLoadingActive,
  } = useQuery<AutomationRule[]>({
    queryKey: ['automation', 'active'],
    queryFn: automationService.getActiveRules,
    enabled: isAuthenticated,
  });

  const createRuleMutation = useMutation({
    mutationFn: (data: CreateAutomationData) => automationService.createRule(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['automation'], refetchType: 'all' });
      toast.success('Quy tắc đã được tạo thành công!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Lỗi khi tạo quy tắc');
    },
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAutomationData }) =>
      automationService.updateRule(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['automation'], refetchType: 'all' });
      toast.success('Quy tắc đã được cập nhật!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Lỗi khi cập nhật quy tắc');
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (id: string) => automationService.deleteRule(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['automation'], refetchType: 'all' });
      toast.success('Quy tắc đã được xóa!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Lỗi khi xóa quy tắc');
    },
  });

  const toggleRuleMutation = useMutation({
    mutationFn: (id: string) => automationService.toggleRule(id),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ['automation'], refetchType: 'all' });
      toast.success(
        `Quy tắc đã ${data.isActive ? 'kích hoạt' : 'vô hiệu hóa'}!`
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Lỗi khi thay đổi trạng thái quy tắc');
    },
  });

  const createRule = async (data: CreateAutomationData) => {
    return createRuleMutation.mutateAsync(data);
  };

  const updateRule = async (id: string, data: UpdateAutomationData) => {
    return updateRuleMutation.mutateAsync({ id, data });
  };

  const deleteRule = async (id: string) => {
    const confirmed = window.confirm('Bạn có chắc chắn muốn xóa quy tắc này?');
    if (!confirmed) return;
    return deleteRuleMutation.mutateAsync(id);
  };

  const toggleRule = async (id: string) => {
    return toggleRuleMutation.mutateAsync(id);
  };

  return {
    rules,
    activeRules,
    isLoading,
    isLoadingActive,
    error,

    createRule,
    updateRule,
    deleteRule,
    toggleRule,
    refetch,

    isCreating: createRuleMutation.isPending,
    isUpdating: updateRuleMutation.isPending,
    isDeleting: deleteRuleMutation.isPending,
    isToggling: toggleRuleMutation.isPending,
  };
}

export function useAutomationRule(id: string | null) {
  return useQuery<AutomationRule>({
    queryKey: ['automation', 'rule', id],
    queryFn: () => automationService.getRuleById(id!),
    enabled: !!id,
  });
}
