import { LegalPage } from "@/components/LegalPage";
import { termsOfService } from "@/data/legal";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useSeo } from "@/hooks/use-seo";

const TERMS_DESCRIPTION =
  "The terms that govern use of zagran.dev and applications published by Serhii Zahranychnyi, including permitted use, intellectual property, and disclaimers.";

const Terms = () => {
  useDocumentTitle("Terms of Service");
  useSeo({ path: "/terms", title: "Terms of Service | Serhii Zahranychnyi", description: TERMS_DESCRIPTION });

  return <LegalPage title="Terms of Service" content={termsOfService} />;
};

export default Terms;
