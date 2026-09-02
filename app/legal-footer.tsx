const publicBasePath = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");

export default function LegalFooter() {
  const legalHref = `${publicBasePath}/legal` || "/legal";

  return (
    <footer className="ggw-legal-footer">
      <div className="ggw-legal-footer-inner">
        <span>© Erez Haimowicz. All Rights Reserved.</span>
        <span>Prompts and AI-assisted guidance are provided for educational and operational support only. Verify outputs, follow GGW policy, and obtain professional review when required. Erez Haimowicz is not liable for decisions or outcomes resulting from use of this portal.</span>
        <a href={legalHref}>Terms &amp; Disclaimer</a>
      </div>
    </footer>
  );
}
