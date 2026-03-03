import { useState } from "react";
import { ModeSelector } from "./components/layout/ModeSelector";
import { SetupScreen } from "./components/setup/SetupScreen";
import { DebateStage } from "./components/debate/DebateStage";
import { useDebateStore } from "./store/debateStore";
import { fetchPersonas } from "./lib/api";

const SCREENS = {
  HOME:   "home",
  SETUP:  "setup",
  DEBATE: "debate",
};

export default function App() {
  const [screen, setScreen] = useState(SCREENS.HOME);
  const [mode, setMode]     = useState(null);
  const store = useDebateStore();

  function handleModeSelect(selectedMode) {
    setMode(selectedMode);
    setScreen(SCREENS.SETUP);
  }

  async function handleSetupStart({ topic, personaIds, customPersonas = [] }) {
    const allServerPersonas = await fetchPersonas();

    const resolved = personaIds.map((id) => {
    const custom = customPersonas.find((c) => c.id === id);
    if (custom) return custom;
    return allServerPersonas.find((p) => p.id === id) ?? { id };
});

    store.initDebate({ mode, topic, personas: resolved });
    setScreen(SCREENS.DEBATE);
  }

  function handleReset() {
    store.reset();
    setScreen(SCREENS.HOME);
    setMode(null);
  }

  if (screen === SCREENS.HOME)  return <ModeSelector onSelect={handleModeSelect} />;
  if (screen === SCREENS.SETUP) return <SetupScreen mode={mode} onStart={handleSetupStart} onBack={() => setScreen(SCREENS.HOME)} />;
  if (screen === SCREENS.DEBATE) return <DebateStage onReset={handleReset} />;
}