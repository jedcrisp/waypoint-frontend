import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../firebase'

export const usePortalAccessGuard = () => {
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const host = window.location.hostname
    const isLocalhost = host === 'localhost' || host.startsWith('localhost:')
    const parts = host.split('.')

    // Determine main site vs. subdomain
    const isMainSite = host === "thewaypoint.app"
    const subdomain = isMainSite
      ? null
      : isLocalhost
      ? 'demo'
      : parts.length >= 3
      ? parts[0]
      : null

    console.log("✅ Hostname:", host)
    console.log("✅ Subdomain detected:", subdomain)

    // Bypass portal check on the main site
    if (isMainSite) {
      console.log("Bypassing portal check on main site");
      setLoading(false);
      return;
    }

    if (!subdomain) {
      console.warn("❌ Invalid subdomain");
      setLoading(false);
      navigate('/unauthorized');
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        console.warn("❌ No user — redirecting to /login");
        setLoading(false);
        navigate('/login');
        return;
      }

      try {
        console.log("✅ Authenticated user:", user.email);
        const token = await user.getIdToken();
        console.log("🔐 Firebase token (shortened):", token.slice(0, 24) + '...');

        const portalRef = doc(db, 'clientPortals', subdomain);
        console.log("📄 Attempting to read:", `clientPortals/${subdomain}`);

        const portalSnap = await getDoc(portalRef);

        if (!portalSnap.exists()) {
          console.warn("❌ No portal found at:", subdomain);
          setLoading(false);
          navigate('/unauthorized');
          return;
        }

        const allowedUsers = portalSnap.data()?.allowedUsers || [];
        console.log("✅ Allowed Users:", allowedUsers);
        console.log("👤 Current User:", user.email);

        const normalizedAllowed = allowedUsers.map(e => e.toLowerCase().trim());
        const normalizedEmail = user.email.toLowerCase().trim();

        if (!normalizedAllowed.includes(normalizedEmail)) {
          console.warn("❌ User not allowed:", normalizedEmail);
          setLoading(false);
          navigate('/unauthorized');
        } else {
          console.log("✅ User is authorized ✔️");
          setLoading(false);
        }
      } catch (err) {
        console.error("🔥 Firestore access error:", err);
        setLoading(false);
        navigate('/unauthorized');
      }
    });

    return () => unsubscribe();
  }, []);

  return { loading };
};
