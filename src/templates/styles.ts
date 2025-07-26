export const professionalStyles = {
  // Base styles
  base: `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font: 13px/1.5 'Inter', 'Segoe UI', Arial, sans-serif;
      color: #1e293b;
      background: #fff;
    }
  `,

  // Container styles
  container: `
    .container {
      max-width: 100%;
      overflow-x: auto;
      padding: 20px;
    }
  `,

  // Title styles
  title: `
    h1 {
      font-size: 20px;
      text-align: center;
      margin: 0 0 30px;
      color: #1e293b;
      font-weight: 600;
      letter-spacing: 0.5;
    }
  `,

  // Table styles
  table: `
    .table-wrapper {
      overflow-x: auto;
      margin: 20px 0;
    }
    
    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      font-size: 13px;
      table-layout: auto;
      border-radius: 8px;
      overflow: hidden;
    }
  `,

  // Header styles
  header: `
    th {
      background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%);
      color: #fff;
      font-weight: 600;
      padding: 16px 24px;
      text-align: left;
      position: sticky;
      top: 0;
      font-size: 14px;
      letter-spacing: 0.3;
    }
  `,

  // Cell styles
  cells: `
    td {
      padding: 16px 24px;
      border-bottom: 1px solid #e2e8f0;
      word-wrap: break-word;
      max-width: 200px;
      font-size: 13px;
    }
    
    tr:nth-child(even) {
      background: #f8fafc;
    }
    
    tr:nth-child(odd) {
      background: #ffffff;
    }
    
    tr:hover {
      background: #f1f5f9;
    }
  `,

  // Footer styles
  footer: `
    .footer {
      margin-top: 20px;
      text-align: center;
      font-size: 11px;
      color: #64748b;
      font-weight: 500;
      padding: 16px;
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      border-radius: 8px;
    }
  `,

  // Print styles
  print: `
    @media print {
      body {
        margin: 0;
        -webkit-print-color-adjust: exact;
      }
      
      .no-print {
        display: none;
      }
      
      table {
        page-break-inside: auto;
      }
      
      tr {
        page-break-inside: avoid;
        page-break-after: auto;
      }
      
      thead {
        display: table-header-group;
      }
      
      th {
        background: #4f46e5 !important;
        color: #fff !important;
      }
    }
  `,

  // Responsive styles
  responsive: `
    @media screen and (max-width: 768px) {
      table {
        font-size: 12px;
      }
      
      th, td {
        padding: 12px 16px;
      }
      
      .container {
        padding: 10px;
      }
    }
  `,

  // Complete stylesheet
  complete: `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    @page {
      size: A4;
      margin: 15mm;
    }
    
    body {
      font: 13px/1.5 'Inter', 'Segoe UI', Arial, sans-serif;
      color: #1e293b;
      background: #fff;
    }
    
    .container {
      max-width: 100%;
      overflow-x: auto;
      padding: 20px;
    }
    
    h1 {
      font-size: 20px;
      text-align: center;
      margin: 0 0 30px;
      color: #1e293b;
      font-weight: 600;
      letter-spacing: 0.5;
    }
    
    .table-wrapper {
      overflow-x: auto;
      margin: 20px 0;
    }
    
    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      font-size: 13px;
      table-layout: auto;
      border-radius: 8px;
      overflow: hidden;
    }
    
    th {
      background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%);
      color: #fff;
      font-weight: 600;
      padding: 16px 24px;
      text-align: left;
      position: sticky;
      top: 0;
      font-size: 14px;
      letter-spacing: 0.3;
    }
    
    td {
      padding: 16px 24px;
      border-bottom: 1px solid #e2e8f0;
      word-wrap: break-word;
      max-width: 200px;
      font-size: 13px;
    }
    
    tr:nth-child(even) {
      background: #f8fafc;
    }
    
    tr:nth-child(odd) {
      background: #ffffff;
    }
    
    tr:hover {
      background: #f1f5f9;
    }
    
    .footer {
      margin-top: 20px;
      text-align: center;
      font-size: 11px;
      color: #64748b;
      font-weight: 500;
      padding: 16px;
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      border-radius: 8px;
    }
    
    @media print {
      body {
        margin: 0;
        -webkit-print-color-adjust: exact;
      }
      
      .no-print {
        display: none;
      }
      
      table {
        page-break-inside: auto;
      }
      
      tr {
        page-break-inside: avoid;
        page-break-after: auto;
      }
      
      thead {
        display: table-header-group;
      }
      
      th {
        background: #4f46e5 !important;
        color: #fff !important;
      }
    }
    
    @media screen and (max-width: 768px) {
      table {
        font-size: 12px;
      }
      
      th, td {
        padding: 12px 16px;
      }
      
      .container {
        padding: 10px;
      }
    }
  `,
};
