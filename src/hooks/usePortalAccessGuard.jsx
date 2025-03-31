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
    // Assume the main domain is "thewaypoint.app"
    // If the hostname exactly equals the main domain, we consider it "main site"
    const isMainSite = host === "thewaypoint.app"
    // Otherwise, if there's a subdomain, it might be "demo.thewaypoint.app" etc.
    const isLocalhost = host === 'localhost' || host.startsWith('localhost:')
    const parts = host.split('.')
    const subdomain = isMainSite
      ? null
      : isLocalhost
      ? 'demo' // fallback for local testing on a subdomain
      : parts.length >= 3
      ? parts[0]
      : null

    console.log("✅ Hostname:", host)
    console.log("✅ Subdomain detected:", subdomain)

    // If on main site, bypass the subdomain check:
    if (isMainSite) {
      console.log("Bypassing portal check on main site");
      setLoading(false);
      return;
    }

    if (!subdomain) {
      console.warn("❌ Invalid subdomain")
      navigate('/unauthorized')
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        console.warn("❌ No user — redirecting to /login")
        navigate('/login')
        return;
      }

      try {
        console.log("✅ Authenticated user:", user.email)
        const token = await user.getIdToken()
        console.log("🔐 Firebase token (shortened):", token.slice(0, 24) + '...')

        // Only check Firestore for subdomains
        const portalRef = doc(db, 'clientPortals', subdomain)
        console.log("📄 Attempting to read:", `clientPortals/${subdomain}`)

        const portalSnap = await getDoc(portalRef)

        if (!portalSnap.exists()) {
          console.warn("❌ No portal found at:", subdomain)
          navigate('/unauthorized')
          return;
        }

        const allowedUsers = portalSnap.data()?.allowedUsers || []
        console.log("✅ Allowed Users:", allowedUsers)
        console.log("👤 Current User:", user.email)

        // Normalize emails for comparison
        const normalizedAllowed = allowedUsers.map(email => email.toLowerCase().trim());
        const normalizedUserEmail = user.email.toLowerCase().trim();

        if (!normalizedAllowed.includes(normalizedUserEmail)) {
          console.warn("❌ User not allowed:", user.email)
          navigate('/unauthorized')
        } else {
          console.log("✅ User is authorized ✔️")
          setLoading(false)
        }
      } catch (err) {
        console.error("🔥 Firestore access error:", err)
        navigate('/unauthorized')
      }
    })

    return () => unsubscribe()
  }, [])

  return { loading }
}
