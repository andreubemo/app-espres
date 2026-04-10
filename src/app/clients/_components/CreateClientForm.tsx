"use client"

import { useState, useTransition } from "react"
import { createClientAction } from "../actions"

export default function CreateClientForm() {
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    startTransition(async () => {
      await createClientAction({
        name,
        email,
        password,
      })

      setName("")
      setEmail("")
      setPassword("")
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border rounded p-4 space-y-4"
    >
      <h2 className="font-semibold">Crear cliente</h2>

      <input
        placeholder="Nombre"
        className="w-full border p-2 rounded"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <input
        type="email"
        placeholder="Email"
        className="w-full border p-2 rounded"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <input
        type="password"
        placeholder="Contraseña"
        className="w-full border p-2 rounded"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <button
        type="submit"
        disabled={isPending}
        className="bg-black text-white px-4 py-2 rounded"
      >
        {isPending ? "Creando..." : "Crear"}
      </button>
    </form>
  )
}
