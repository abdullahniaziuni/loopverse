import { useState, useEffect, useCallback } from "react";
import { apiService } from "../services/api";
import { ApiResponse } from "../types";

// Generic API hook for any API call
export function useApi<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  dependencies: any[] = [],
  immediate: boolean = true
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiCall();
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error || "An error occurred");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  const refetch = useCallback(() => {
    execute();
  }, [execute]);

  return {
    data,
    isLoading,
    error,
    refetch,
    execute,
  };
}

// Specific hooks for common API operations
export function useMentors(filters?: any) {
  return useApi(
    () => apiService.getMentors(filters),
    [JSON.stringify(filters)]
  );
}

export function useMentor(id: string) {
  return useApi(() => apiService.getMentorById(id), [id], !!id);
}

export function useSessions(filters?: any) {
  return useApi(
    () => apiService.getSessions(filters),
    [JSON.stringify(filters)]
  );
}

export function useSession(id: string) {
  return useApi(() => apiService.getSessionById(id), [id], !!id);
}

export function useBookingRequests(filters?: any) {
  return useApi(
    () => apiService.getBookingRequests(filters),
    [JSON.stringify(filters)]
  );
}

export function useDashboardStats() {
  return useApi(() => apiService.getDashboardStats(), []);
}

export function useMentorAvailability(mentorId: string, date?: string) {
  return useApi(
    () => apiService.getMentorAvailability(mentorId, date),
    [mentorId, date],
    !!mentorId
  );
}

// Mutation hooks for API operations that modify data
export function useApiMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>
) {
  const [data, setData] = useState<TData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (variables: TVariables) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await mutationFn(variables);
        if (response.success && response.data) {
          setData(response.data);
          return response.data;
        } else {
          const errorMessage = response.error || "An error occurred";
          setError(errorMessage);
          throw new Error(errorMessage);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An unexpected error occurred";
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [mutationFn]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    data,
    isLoading,
    error,
    mutate,
    reset,
  };
}

// Specific mutation hooks
export function useCreateBooking() {
  return useApiMutation((bookingData: any) =>
    apiService.createBookingRequest(bookingData)
  );
}

export function useRespondToBooking() {
  return useApiMutation(
    ({
      id,
      response,
      message,
    }: {
      id: string;
      response: "accepted" | "rejected";
      message?: string;
    }) => apiService.respondToBookingRequest(id, response, message)
  );
}

export function useSubmitFeedback() {
  return useApiMutation(
    ({
      sessionId,
      feedback,
    }: {
      sessionId: string;
      feedback: { rating: number; comment?: string };
    }) => apiService.submitFeedback(sessionId, feedback)
  );
}

export function useUpdateProfile() {
  return useApiMutation((profileData: any) =>
    apiService.updateProfile(profileData)
  );
}

export function useCreateSession() {
  return useApiMutation((sessionData: any) =>
    apiService.createSession(sessionData)
  );
}

export function useCancelSession() {
  return useApiMutation(({ id, reason }: { id: string; reason?: string }) =>
    apiService.cancelSession(id, reason)
  );
}

export function useApproveMentor() {
  return useApiMutation(
    ({
      applicationId,
      approved,
      comments,
    }: {
      applicationId: string;
      approved: boolean;
      comments?: string;
    }) => apiService.approveMentorApplication(applicationId, approved, comments)
  );
}

export function useUploadFile() {
  return useApiMutation(
    ({
      file,
      type,
    }: {
      file: File;
      type: "avatar" | "resource" | "portfolio" | "session";
    }) => apiService.uploadFile(file, type)
  );
}

export function useUploadSessionFile() {
  return useApiMutation(
    ({ file, sessionId }: { file: File; sessionId?: string }) =>
      apiService.uploadSessionFile(file, sessionId)
  );
}

// Optimistic update hook
export function useOptimisticUpdate<T>(
  initialData: T[],
  updateFn: (items: T[], newItem: T) => T[]
) {
  const [optimisticData, setOptimisticData] = useState<T[]>(initialData);

  const addOptimistic = useCallback(
    (newItem: T) => {
      setOptimisticData((current) => updateFn(current, newItem));
    },
    [updateFn]
  );

  const revert = useCallback(() => {
    setOptimisticData(initialData);
  }, [initialData]);

  const commit = useCallback((finalData: T[]) => {
    setOptimisticData(finalData);
  }, []);

  return {
    data: optimisticData,
    addOptimistic,
    revert,
    commit,
  };
}

// Infinite scroll hook
export function useInfiniteScroll<T>(
  fetchFn: (
    page: number
  ) => Promise<ApiResponse<{ items: T[]; hasMore: boolean }>>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const loadInitial = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setPage(1);

    try {
      const response = await fetchFn(1);
      if (response.success && response.data) {
        setData(response.data.items);
        setHasMore(response.data.hasMore);
      } else {
        setError(response.error || "Failed to load data");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, dependencies);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    const nextPage = page + 1;

    try {
      const response = await fetchFn(nextPage);
      if (response.success && response.data) {
        setData((current) => [...current, ...response.data!.items]);
        setHasMore(response.data.hasMore);
        setPage(nextPage);
      } else {
        setError(response.error || "Failed to load more data");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoadingMore(false);
    }
  }, [fetchFn, hasMore, isLoadingMore, page]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  return {
    data,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    refetch: loadInitial,
  };
}

// Real-time data hook (for WebSocket connections)
export function useRealTimeData<T>(
  endpoint: string,
  initialData: T | null = null
) {
  const [data, setData] = useState<T | null>(initialData);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // This would be implemented when WebSocket is added
    // For now, it's a placeholder for future real-time functionality

    return () => {
      // Cleanup WebSocket connection
    };
  }, [endpoint]);

  return {
    data,
    isConnected,
    error,
    setData, // For manual updates
  };
}

// Debounced search hook
export function useDebouncedSearch<T>(
  searchFn: (query: string) => Promise<ApiResponse<T[]>>,
  delay: number = 300
) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await searchFn(query);
        if (response.success && response.data) {
          setResults(response.data);
        } else {
          setError(response.error || "Search failed");
          setResults([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed");
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [query, searchFn, delay]);

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
  };
}
