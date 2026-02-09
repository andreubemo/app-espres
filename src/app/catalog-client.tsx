"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  RowActions,
  Checkbox,
  SearchBar,
  Select,
  Pagination,
} from "@/components/ui";
import CreateItemModal from "@/components/catalog/create-item-modal";

type Item = {
  id: number;
  name: string;
  category: string;
  unit: string;
  price: number;
};

export default function CatalogClient({
  initialData,
}: {
  initialData: Item[];
}) {
  // ✅ ESTE ESTADO ES EL QUE FALTABA
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const data = initialData;

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const categories = useMemo(
    () => Array.from(new Set(data.map((i) => i.category))),
    [data]
  );

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        category === "" || item.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [data, search, category]);

  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [search, category]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page]);

  const allSelected =
    paginatedData.length > 0 &&
    paginatedData.every((i) => selectedIds.includes(i.id));

  function toggleAll() {
    setSelectedIds(
      allSelected ? [] : paginatedData.map((i) => i.id)
    );
  }

  function toggleOne(id: number) {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  }

  return (
    <div className="p-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Catálogo</h1>
        <CreateItemModal />
      </div>

      <div className="flex gap-4">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Buscar…"
        />
        <Select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Todas</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox checked={allSelected} onChange={toggleAll} />
            </TableHead>
            <TableHead>Concepto</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Unidad</TableHead>
            <TableHead className="text-right">Precio</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>

        <TableBody>
          {paginatedData.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="w-10">
                <Checkbox
                  checked={selectedIds.includes(item.id)}
                  onChange={() => toggleOne(item.id)}
                />
              </TableCell>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.category}</TableCell>
              <TableCell>{item.unit}</TableCell>
              <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
              <TableCell>
                <RowActions
                  onEdit={() => setEditingItem(item)}
                  onDelete={() => console.log("Delete", item.id)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex justify-center mt-6">
        <Pagination
          page={page}
          pageSize={pageSize}
          total={filteredData.length}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
