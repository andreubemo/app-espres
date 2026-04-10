import { getServerSession } from "@/lib/session"
import { getClientsByCompany } from "@/server/services/client.service"
import CreateClientForm from "./_components/CreateClientForm"

export default async function ClientsPage() {
  const session = await getServerSession()
  const clients = await getClientsByCompany(session.user.companyId)

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Clientes</h1>

      <CreateClientForm />

      <div className="border rounded p-4">
        <h2 className="font-semibold mb-4">Listado</h2>

        {clients.length === 0 ? (
          <p className="text-sm text-gray-500">
            No hay clientes todavía.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Nombre</th>
                <th className="text-left p-2">Email</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-b">
                  <td className="p-2">{c.name}</td>
                  <td className="p-2">{c.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  )
}
