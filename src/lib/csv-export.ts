/**
 * CSV Export Utility
 * Exports data arrays to CSV files with BOM for Persian/Unicode character support.
 */

interface ColumnMapping {
  key: string
  label: string
  transform?: (value: unknown, row: Record<string, unknown>) => string
}

/**
 * Escapes a CSV cell value by wrapping in quotes and doubling internal quotes.
 */
function escapeCSVCell(value: string): string {
  if (value.includes('"') || value.includes(',') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Exports an array of objects to a CSV file and triggers a browser download.
 *
 * @param data - Array of objects to export
 * @param filename - Name of the downloaded file (without .csv extension)
 * @param columns - Optional column mappings. If omitted, all keys from the first row are used.
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  columns?: ColumnMapping[],
): void {
  if (data.length === 0) return

  // Determine columns: use mappings or extract keys from first row
  const cols: ColumnMapping[] = columns ?? Object.keys(data[0]).map(key => ({ key, label: key }))

  // Build header row
  const header = cols.map(c => escapeCSVCell(c.label)).join(',')

  // Build data rows
  const rows = data.map(row =>
    cols.map(col => {
      const raw = row[col.key]
      if (col.transform) {
        return escapeCSVCell(col.transform(raw, row))
      }
      // Handle null/undefined
      const value = raw === null || raw === undefined ? '' : String(raw)
      return escapeCSVCell(value)
    }).join(','),
  )

  // Combine header + rows with BOM for Persian/Unicode support
  const bom = '\uFEFF'
  const csvContent = bom + header + '\n' + rows.join('\n')

  // Create blob and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.csv`
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
