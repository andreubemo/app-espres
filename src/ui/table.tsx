import { ReactNode } from "react";

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="relative overflow-visible">
      <table className="w-full border-collapse">
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children }: { children: ReactNode }) {
  return <thead className="border-b">{children}</thead>;
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody className="overflow-visible">{children}</tbody>;
}

export function TableRow({ children }: { children: ReactNode }) {
  return <tr className="border-b last:border-0">{children}</tr>;
}

export function TableHead({
  children,
  className = "",
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <th className={`px-3 py-2 text-left text-sm font-medium text-gray-500 ${className}`}>
      {children}
    </th>
  );
}

export function TableCell({
  children,
  className = "",
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <td className={`px-3 py-2 text-sm align-middle ${className}`}>
      {children}
    </td>
  );
}
