import { LegalPage } from "@/components/LegalPage";
import { privacyPolicy } from "@/data/legal";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useSeo } from "@/hooks/use-seo";

const PRIVACY_DESCRIPTION =
  "How zagran.dev and applications published by Serhii Zahranychnyi handle information: what is collected, why, and the choices you have.";

const Privacy = () => {
  useDocumentTitle("Privacy Policy");
  useSeo({ path: "/privacy", title: "Privacy Policy | Serhii Zahranychnyi", description: PRIVACY_DESCRIPTION });

  return <LegalPage title="Privacy Policy" content={privacyPolicy} />;
};

export default Privacy;
