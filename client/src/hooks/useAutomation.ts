import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { automationService, type AutomationRule, type CreateAutomationData, type UpdateAutomationData } from '@/services/automation.service';
import toast from 'react-hot-toast';

/**
 * Hook để quản lý automation rules
 * Cung cấp các methods để lấy, tạo, sửa, xóa automation rules
 */
export function useAutomation() {
  const queryClient = useQueryClient();

  // Lấy tất cả automation rules
  const {
    data: rules = [],
    isLoading,
    error,
    refetch,
  } = useQuery<AutomationRule[]>({
    queryKey: ['automation', 'rules'],
    queryFn: automationService.getAllRules,
  });

  // Lấy automation rules đang hoạt động
  const {
    data: activeRules = [],
    isLoading: isLoadingActive,
  } = useQuery<AutomationRule[]>({
    queryKey: ['automation', 'active'],
    queryFn: automationService.getActiveRules,
  });

  // Tạo automation rule mới
  const createRuleMutation = useMutation({
    mutationFn: (data: CreateAutomationData) => automationService.createRule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation'] });
      toast.success('Quy tắc đã được tạo thành công!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Lỗi khi tạo quy tắc');
    },
  });

  // Cập nhật automation rule
  const updateRuleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAutomationData }) =>
      automationService.updateRule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation'] });
      toast.success('Quy tắc đã được cập nhật!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Lỗi khi cập nhật quy tắc');
    },
  });

  // Xóa automation rule
  const deleteRuleMutation = useMutation({
    mutationFn: (id: string) => automationService.deleteRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation'] });
      toast.success('Quy tắc đã được xóa!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Lỗi khi xóa quy tắc');
    },
  });

  // Bật/tắt automation rule
  const toggleRuleMutation = useMutation({
    mutationFn: (id: string) => automationService.toggleRule(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['automation'] });
      toast.success(
        `Quy tắc đã ${data.isActive ? 'kích hoạt' : 'vô hiệu hóa'}!`
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Lỗi khi thay đổi trạng thái quy tắc');
    },
  });

  // Helper functions
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
    // Data
    rules,
    activeRules,
    isLoading,
    isLoadingActive,
    error,

    // Actions
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
    refetch,

    // Mutation states
    isCreating: createRuleMutation.isPending,
    isUpdating: updateRuleMutation.isPending,
    isDeleting: deleteRuleMutation.isPending,
    isToggling: toggleRuleMutation.isPending,
  };
}

/**
 * Hook để lấy chi tiết một automation rule
 */
export function useAutomationRule(id: string | null) {
  return useQuery<AutomationRule>({
    queryKey: ['automation', 'rule', id],
    queryFn: () => automationService.getRuleById(id!),
    enabled: !!id,
  });
}
