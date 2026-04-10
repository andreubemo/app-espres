"use client"

import { useState, useTransition } from "react"
import { createBudgetAction } from "@/app/(dashboard)/budgets/new/actions"

export default function CreateBudgetForm({
  clients,
}: {
  clients: { id: string; name: string }[]
}) {
  const [isPending, startTransition] = useTransition()

  const [code, setCode] = useState("")
  const [project, setProject] = useState("")
  const [clientId, setClientId] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    startTransition(async () => {
      await createBudgetAction({
        code,
        project,
        clientId,
      })
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border rounded p-4 space-y-4 max-w-md"
    >
      <input
        placeholder="Código"
        className="w-full border p-2 rounded"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        required
      />

      <input
        placeholder="Proyecto"
        className="w-full border p-2 rounded"
        value={project}
        onChange={(e) => setProject(e.target.value)}
        required
      />

      <select
        className="w-full border p-2 rounded"
        value={clientId}
        onChange={(e) => setClientId(e.target.value)}
        required
      >
        <option value="">Seleccionar cliente</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <button
        type="submit"
        disabled={isPending}
        className="bg-black text-white px-4 py-2 rounded"
      >
        {isPending ? "Creando..." : "Crear presupuesto"}
      </button>
    </form>
  )
}
