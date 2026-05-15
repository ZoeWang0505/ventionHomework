// TestConsumer.tsx
import { useController } from "./MainViewController";

export function TestController({ callback }: { callback: (api: any) => void }) {
  const ctx = useController();
  callback(ctx); // expose provider API to the test
  return null;
}