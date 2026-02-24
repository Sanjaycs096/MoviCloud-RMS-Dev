import { useState } from "react";
import { KDSTerminalLogin } from "./kds-terminal-login";
import { KDSProductionQueue } from "./kds-production-queue";

type StationType = "FRY" | "CURRY" | "RICE" | "PREP" | "GRILL" | "DESSERT" | "HEAD_CHEF";

export function MochaKDS() {
  const [loggedInStation, setLoggedInStation] = useState<StationType | null>(null);

  const handleLogin = (station: StationType) => {
    setLoggedInStation(station);
  };

  const handleLogout = () => {
    setLoggedInStation(null);
  };

  if (!loggedInStation) {
    return <KDSTerminalLogin onLogin={handleLogin} />;
  }

  return <KDSProductionQueue station={loggedInStation} onLogout={handleLogout} />;
}
