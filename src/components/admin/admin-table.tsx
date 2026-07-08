import { getTranslations } from 'next-intl/server';

interface AdminTableProps {
  headers: string[];
  rows: React.ReactNode[][];
}

export async function AdminTable({ headers, rows }: AdminTableProps) {
  const t = await getTranslations('admin.table');

  return (
    <div className="overflow-x-auto rounded-card border border-border bg-card">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
            {headers.map((header) => (
              <th key={header} scope="col" className="px-4 py-3 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={headers.length}
                className="px-4 py-10 text-center text-muted-foreground"
              >
                {t('empty')}
              </td>
            </tr>
          ) : (
            rows.map((cells, i) => (
              <tr key={i} className="border-b border-border last:border-b-0">
                {cells.map((cell, j) => (
                  <td key={j} className="px-4 py-3.5 align-middle">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
