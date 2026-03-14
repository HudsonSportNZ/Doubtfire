import { useLocation } from "react-router-dom";
import { PATH_LABELS } from "../lib/constants";
import { PlaceholderTab } from "../components/ui";

export default function PlaceholderPage() {
  const location = useLocation();
  const title = PATH_LABELS[location.pathname] || "Coming Soon";
  return <PlaceholderTab title={title} />;
}
