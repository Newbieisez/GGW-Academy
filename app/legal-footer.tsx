const publicBasePath = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");

export default function LegalFooter() {
  const legalHref = `${publicBasePath}/legal` || "/legal";

  return (
    <footer className="ggw-legal-footer">
      <div className="ggw-legal-footer-inner">
        <div className="ggw-legal-owner">
          <strong>© Erez Haimowicz. All Rights Reserved.</strong>
          <span>GGW AI Workbench · Created for practical, responsible AI-enabled work.</span>
        </div>
        <p>
          This portal, its prompts, workflows, examples, and AI-assisted guidance are provided for educational and operational support only. They are not legal, tax, accounting, financial, HR, regulatory, or other professional advice. AI outputs may be incomplete, inaccurate, or inappropriate for a specific situation. Users are responsible for independently verifying information, following GGW policies and applicable requirements, protecting confidential data, obtaining required approvals, and seeking qualified professional advice when needed. To the fullest extent permitted by law, Erez Haimowicz is not responsible for decisions, actions, losses, claims, or damages arising from use of or reliance on this portal, its prompts, or AI-generated outputs.
        </p>
        <div className="ggw-legal-links">
          <a href={legalHref}>Terms &amp; Disclaimer</a>
          <span>Always verify before sending, publishing, changing records, or making compliance-sensitive decisions.</span>
        </div>
      </div>
    </footer>
  );
}
