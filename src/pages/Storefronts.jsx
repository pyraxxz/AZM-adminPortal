import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storefronts as sfApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import StatCard from '@/components/admin/StatCard';
import { Store, Eye, EyeOff, ChevronLeft, ChevronRight, Lock, Unlock } from 'lucide-react';
import { toast } from 'sonner';

export default function Storefronts() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-storefronts', page],
    queryFn: () => sfApi.list(page, 20),
  });

  const disableMutation = useMutation({
    mutationFn: sfApi.disable,
    onSuccess: () => {
      toast.success('Storefront disabled');
      queryClient.invalidateQueries({ queryKey: ['admin-storefronts'] });
    },
    onError: (e) => toast.error(e.message),
  });

  const enableMutation = useMutation({
    mutationFn: sfApi.enable,
    onSuccess: () => {
      toast.success('Storefront enabled');
      queryClient.invalidateQueries({ queryKey: ['admin-storefronts'] });
    },
    onError: (e) => toast.error(e.message),
  });

  const sf = data?.data;
  const storefronts = sf?.storefronts ?? [];
  const pagination = sf?.pagination;
  const analytics = sf?.analytics ?? [];

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Store className="w-7 h-7 text-amber-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Storefront Moderation</h1>
          <p className="text-sm text-slate-400">{pagination?.total ?? 0} published storefronts</p>
        </div>
      </div>

      {/* Analytics summary */}
      {analytics.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {analytics.map(a => (
            <StatCard key={a.eventType} label={a.eventType.replace(/_/g, ' ')} value={a._count} icon={Store} />
          ))}
        </div>
      )}

      {/* Storefront list */}
      <div className="space-y-3">
        {storefronts.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Store className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No published storefronts yet.</p>
          </div>
        ) : (
          storefronts.map((sf) => {
            const biz = sf.businessProfile;
            const disabled = biz?.storefrontDisabled;
            return (
              <div
                key={sf.id}
                className="flex items-center gap-4 p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:border-slate-600 transition-colors"
              >
                {biz?.logoUrl ? (
                  <img src={biz.logoUrl} alt="" className="w-12 h-12 rounded-xl object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center">
                    <Store className="w-6 h-6 text-slate-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white truncate">{biz?.businessName ?? 'Unknown'}</h3>
                  <p className="text-sm text-slate-400">
                    {biz?.category ?? '—'} · Theme: {sf.theme?.name ?? 'Default'}
                  </p>
                </div>
                <Badge variant={disabled ? 'destructive' : 'success'}>
                  {disabled ? 'Disabled' : 'Active'}
                </Badge>
                {disabled ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => enableMutation.mutate(biz.id)}
                    disabled={enableMutation.isPending}
                  >
                    <Unlock className="w-4 h-4" />
                    Enable
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Disable storefront for ${biz?.businessName}?`)) {
                        disableMutation.mutate(biz.id);
                      }
                    }}
                    disabled={disableMutation.isPending}
                  >
                    <Lock className="w-4 h-4" />
                    Disable
                  </Button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
            Prev
          </Button>
          <span className="text-sm text-slate-400">
            Page {page} of {pagination.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pagination.pages}
            onClick={() => setPage(p => p + 1)}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
