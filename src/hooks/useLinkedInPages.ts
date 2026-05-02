import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface LinkedInProfile {
  id: string;
  localizedFirstName: string;
  localizedLastName: string;
  name: string;
  email?: string | null;
  profilePicture: string | null;
  expiresAt: string | null;
  selectedPageId: string | null;
  selectedPageName: string | null;
}

export interface LinkedInPage {
  id: string;
  name: string;
  vanity_name: string;
  logo: string | null;
  isSelected: boolean;
}

function getLinkedInErrorMessage(status: number, fallback: string) {
  if (status === 401) {
    return "Your LinkedIn session has expired. Please reconnect your account.";
  }

  if (status === 403) {
    return "LinkedIn denied access. Please verify the required permissions were approved.";
  }

  return fallback;
}

export function useLinkedInProfile() {
  const { session } = useAuth();

  return useQuery<LinkedInProfile>({
    queryKey: ["linkedin-profile", session?.user?.id],
    queryFn: async () => {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/linkedin-profile`,
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          getLinkedInErrorMessage(res.status, err.error || "Failed to fetch LinkedIn profile"),
        );
      }

      return res.json();
    },
    enabled: !!session?.access_token,
  });
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
        const err = await res.json().catch(() => ({}));
        throw new Error(
          getLinkedInErrorMessage(res.status, err.error || "Failed to fetch LinkedIn pages"),
        );
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
    mutationFn: async ({ pageId }: { pageId: string }) => {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/linkedin-select-page`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ pageId }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          getLinkedInErrorMessage(res.status, err.error || "Failed to select LinkedIn page"),
        );
      }

      return res.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries to trigger refetch with new selected page
      queryClient.invalidateQueries({ queryKey: ["linkedin-data"] });
      queryClient.invalidateQueries({ queryKey: ["linkedin-pages"] });
      queryClient.invalidateQueries({ queryKey: ["linkedin-profile"] });
      queryClient.invalidateQueries({ queryKey: ["social-connections"] });
      toast.success("LinkedIn page selected successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
