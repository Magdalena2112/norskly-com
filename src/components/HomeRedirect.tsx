import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";

/**
 * Client-side fallback for the legacy /home URL.
 * The primary redirect is the meta refresh baked into dist/home/index.html
 * at build time (see seo/prerender.ts); this only covers in-app navigation.
 */
const HomeRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/", { replace: true });
  }, [navigate]);

  return (
    <>
      <Helmet>
        <link rel="canonical" href="https://norskly.com/" />
      </Helmet>
      <p style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", textAlign: "center" }}>
        Ova stranica je premeštena. <a href="/">Idi na početnu stranicu</a>.
      </p>
    </>
  );
};

export default HomeRedirect;
