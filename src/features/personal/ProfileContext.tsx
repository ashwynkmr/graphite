import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { getProfile, saveProfile, type Profile } from '../../data/repo/meta';

interface ProfileState {
  profile: Profile | null;
  loaded: boolean;
  save: (p: Profile) => Promise<void>;
}

const Ctx = createContext<ProfileState>({ profile: null, loaded: false, save: async () => {} });

/** Loads the on-device profile once and keeps it available to every screen. */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getProfile().then((p) => {
      setProfile(p);
      setLoaded(true);
    });
  }, []);

  const save = useCallback(async (p: Profile) => {
    await saveProfile(p);
    setProfile(await getProfile());
  }, []);

  return <Ctx.Provider value={{ profile, loaded, save }}>{children}</Ctx.Provider>;
}

export function useProfile(): ProfileState {
  return useContext(Ctx);
}
