import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface LinkedInPage {
  id: string;
  name: string;
  vanity_name: string;
  logo_url?: string;
}

export function useLinkedInPages() {
  const { session } = useAuth();

  return useQuery<{ pages: LinkedInPage[] }>({
    queryKey: ["linkedin-pages", session?.user?.id],
    queryFn: async () => {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/linkedin-pages`,
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch LinkedIn pages");
      }
      return res.json();
    },
    enabled: !!session?.access_token,
  });
}

export function useSelectLinkedInPage() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orgId, orgName }: { orgId: string; orgName: string }) => {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/linkedin-select-page`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ orgId, orgName }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to select LinkedIn page");
      }

      return res.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries to trigger refetch with new selected page
      queryClient.invalidateQueries({ queryKey: ["linkedin-data"] });
      queryClient.invalidateQueries({ queryKey: ["social-connections"] });
      toast.success("LinkedIn page selected successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
