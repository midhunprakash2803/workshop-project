/**
 * Export data array to a downloadable CSV file
 * @param {Array<Object>} data - array of objects
 * @param {string} filename - output file name (e.g. 'rentiq-assets')
 * @param {Array<{key: string, label: string}>} columns - optional explicit column mapping
 */
export const exportToCSV = (data, filename = 'export', columns = null) => {
  if (!data || !data.length) {
    alert('No data available to export.');
    return;
  }

  // Determine headers and accessors
  const fieldList = columns || Object.keys(data[0]).map(key => ({ key, label: key }));

  const csvRows = [];

  // Header row
  csvRows.push(fieldList.map(c => `"${c.label.replace(/"/g, '""')}"`).join(','));

  // Data rows
  data.forEach(item => {
    const row = fieldList.map(c => {
      let val = item[c.key];

      // Handle nested values like category.name or borrower.name
      if (c.key.includes('.')) {
        val = c.key.split('.').reduce((obj, k) => (obj ? obj[k] : ''), item);
      }

      if (val === null || val === undefined) {
        return '""';
      }

      if (val instanceof Date) {
        return `"${val.toISOString()}"`;
      }

      if (typeof val === 'object') {
        val = JSON.stringify(val);
      }

      return `"${String(val).replace(/"/g, '""')}"`;
    });
    csvRows.push(row.join(','));
  });

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csvRows.join('\r\n'));
  const link = document.createElement('a');
  link.setAttribute('href', csvContent);
  const timestamp = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `${filename}-${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
