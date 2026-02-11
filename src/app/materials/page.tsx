import { getServerSession } from "@/lib/session"
import { getMaterialsByCompany } from "@/server/services/material.service"
import CreateMaterialForm from "@/app/materials/_components/CreateMaterialForm"

export default async function MaterialsPage() {
  const session = await getServerSession()
  const materials = await getMaterialsByCompany(session.user.companyId)

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Materiales</h1>

      <CreateMaterialForm companyId={session.user.companyId} />

      <div className="border rounded p-4">
        <h2 className="font-semibold mb-4">Listado</h2>

        {materials.length === 0 ? (
          <p className="text-sm text-gray-500">
            No hay materiales todavía.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Nombre</th>
                <th className="text-left p-2">Unidad</th>
                <th className="text-left p-2">Precio</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((m) => (
                <tr key={m.id} className="border-b">
                  <td className="p-2">{m.name}</td>
                  <td className="p-2">{m.unit}</td>
                  <td className="p-2">{m.price.toFixed(2)} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  )
}
