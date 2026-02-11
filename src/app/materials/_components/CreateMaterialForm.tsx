"use client"

import { useState, useTransition } from "react"
import { createMaterialAction } from "../actions"

export default function CreateMaterialForm({
  companyId,
}: {
  companyId: string
}) {
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState("")
  const [unit, setUnit] = useState("")
  const [price, setPrice] = useState("")
  const [description, setDescription] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    startTransition(async () => {
      await createMaterialAction({
        name,
        unit,
        price: Number(price),
        description,
        companyId,
      })

      setName("")
      setUnit("")
      setPrice("")
      setDescription("")
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border rounded p-4 space-y-4"
    >
      <h2 className="font-semibold">Crear material</h2>

      <input
        placeholder="Nombre"
        className="w-full border p-2 rounded"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <input
        placeholder="Unidad (m2, ml, ud...)"
        className="w-full border p-2 rounded"
        value={unit}
        onChange={(e) => setUnit(e.target.value)}
        required
      />

      <input
        type="number"
        step="0.01"
        placeholder="Precio"
        className="w-full border p-2 rounded"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        required
      />

      <textarea
        placeholder="Descripción"
        className="w-full border p-2 rounded"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
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
