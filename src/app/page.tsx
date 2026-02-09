import { getItems } from "./actions/items";
import CatalogClient from "./catalog-client";

export default async function Page() {
  const items = await getItems();
  return <CatalogClient initialData={items} />;
}
