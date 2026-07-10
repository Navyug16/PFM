import { useSettingsContext } from '../contexts/settings-context'

/**
 * Custom hook to retrieve current user preferences and profile parameters.
 */
export const useSettings = () => {
  const { profile, loading, error, updateProfile, refetchProfile } = useSettingsContext()

  return {
    profile,
    loading,
    error,
    updateProfile,
    refetch: refetchProfile,
  }
}
