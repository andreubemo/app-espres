import { Container } from "./container";
import { Button } from "@/components/ui";

export function Header() {
  return (
    <header className="border-b border-border bg-white">
      <Container className="flex h-16 items-center justify-between">
        <span className="text-lg font-bold">ES Group</span>
        <Button variant="ghost">Cerrar sesión</Button>
      </Container>
    </header>
  );
}
