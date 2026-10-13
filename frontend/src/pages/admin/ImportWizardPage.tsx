import React, { useState } from 'react';
import { api } from '../../api/client';
import { Badge } from '../../components/common/Badge';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Download,
  Check,
  RefreshCw,
  Layers,
  Database,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const ImportWizardPage: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectionData, setInspectionData] = useState<any>(null);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});

  // Validation Preview State
  const [isValidating, setIsValidating] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  // Execution State
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // STEP 1: Upload & Inspect
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleInspectFile = async () => {
    if (!selectedFile) return;
    setIsInspecting(true);
    setErrorMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const res = await api.importer.inspect(formData);
      setInspectionData(res);
      if (res.sheets && res.sheets.length > 0) {
        setSelectedSheet(res.sheets[0].name);
      }
      setColumnMapping(res.suggested_mapping || {});
      setStep(2);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to inspect file');
    } finally {
      setIsInspecting(false);
    }
  };

  // STEP 2 -> 3: Validate & Preview
  const handleValidatePreview = async () => {
    if (!selectedFile) return;
    setIsValidating(true);
    setErrorMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('sheet_name', selectedSheet);
      formData.append('column_mapping_json', JSON.stringify(columnMapping));

      const res = await api.importer.preview(formData);
      setPreviewData(res);
      setStep(3);
    } catch (err: any) {
      setErrorMessage(err.message || 'Validation failed');
    } finally {
      setIsValidating(false);
    }
  };

  // STEP 3 -> 4: Execute Transaction
  const handleExecuteImport = async () => {
    if (!previewData || !selectedFile) return;
    setIsExecuting(true);
    setErrorMessage(null);
    try {
      const res = await api.importer.execute({
        filename: selectedFile.name,
        sheet_name: selectedSheet,
        column_mapping: columnMapping,
        records_to_create: previewData.valid_to_create || [],
        records_to_update: previewData.valid_to_update || [],
      });
      setExecutionResult(res);
      setStep(4);
    } catch (err: any) {
      setErrorMessage(err.message || 'Import transaction failed');
    } finally {
      setIsExecuting(false);
    }
  };

  const canonicalFieldLabels: Record<string, string> = {
    roll_number: 'Roll Number / Student ID (Required)',
    full_name: 'Student Name (Required)',
    email: 'Email Address (Required)',
    department_code: 'Department Code (CSE, ECE, MECH, MBA)',
    semester: 'Current Semester (1-12)',
    section: 'Section (A, B)',
    cgpa: 'CGPA (0.00 - 10.00)',
    phone: 'Phone Number',
    guardian_name: 'Parent / Guardian Name',
    guardian_phone: 'Parent Phone Number',
    placement_status: 'Placement Readiness Status',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-txt-primary">Excel & CSV Student Data Import Wizard</h1>
          <p className="text-xs text-txt-secondary mt-1">
            Enterprise batch ingestion with automated sheet mapping, schema validation, and transactional persistence
          </p>
        </div>
        <a
          href={api.importer.downloadTemplateUrl}
          download
          className="px-3.5 py-2 text-xs font-medium rounded-lg border border-brd bg-bg-highlight hover:border-brand-blue text-txt-primary transition-colors flex items-center space-x-1.5 shadow-sm"
        >
          <Download className="w-4 h-4 text-brand-blue" />
          <span>Download Sample CSV Template</span>
        </a>
      </div>

      {/* Wizard Progress Steps */}
      <div className="bg-white p-4 rounded-xl border border-brd shadow-subtle">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {[
            { num: 1, label: 'Upload File' },
            { num: 2, label: 'Map Columns' },
            { num: 3, label: 'Preview & Validate' },
            { num: 4, label: 'Persist Database' },
          ].map((s, idx) => (
            <React.Fragment key={s.num}>
              <div className="flex items-center space-x-2">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    step >= s.num
                      ? 'bg-navy-900 text-white'
                      : 'bg-bg-secondary text-txt-muted border border-brd'
                  }`}
                >
                  {step > s.num ? <Check className="w-3.5 h-3.5" /> : s.num}
                </span>
                <span
                  className={`text-xs font-medium hidden sm:inline ${
                    step >= s.num ? 'text-txt-primary' : 'text-txt-muted'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {idx < 3 && <div className={`flex-1 h-0.5 mx-3 ${step > idx + 1 ? 'bg-navy-900' : 'bg-brd'}`} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-status-danger/10 border border-status-danger/30 text-status-danger text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* STEP 1: UPLOAD FILE */}
      {step === 1 && (
        <div className="bg-white p-8 rounded-xl border border-brd shadow-subtle max-w-2xl mx-auto space-y-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-navy-800/10 mx-auto flex items-center justify-center text-navy-800 mb-3 border border-brd">
              <Upload className="w-6 h-6 text-brand-blue" />
            </div>
            <h2 className="text-base font-bold text-txt-primary">Select Academic Workbook or CSV</h2>
            <p className="text-xs text-txt-secondary mt-1">
              Supports .xlsx, .xls, and .csv formats up to 15MB.
            </p>
          </div>

          <div className="p-6 border-2 border-dashed border-brd rounded-xl bg-bg-highlight/40 text-center hover:bg-bg-highlight transition-colors">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer block">
              <span className="text-xs font-semibold text-brand-blue hover:underline">
                {selectedFile ? selectedFile.name : 'Click to browse files on your computer'}
              </span>
              <p className="text-[11px] text-txt-muted mt-1">
                {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'No file chosen'}
              </p>
            </label>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleInspectFile}
              disabled={!selectedFile || isInspecting}
              className="px-5 py-2.5 text-xs font-medium rounded-lg bg-navy-900 text-white hover:bg-navy-800 transition-colors flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
            >
              {isInspecting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Inspecting Workbook Sheets...</span>
                </>
              ) : (
                <>
                  <span>Proceed to Sheet & Column Mapping</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: SHEET SELECTION & COLUMN MAPPING */}
      {step === 2 && inspectionData && (
        <div className="bg-white p-6 rounded-xl border border-brd shadow-subtle space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brd pb-4">
            <div>
              <h2 className="text-sm font-bold text-txt-primary">Map File Columns to Student Database</h2>
              <p className="text-xs text-txt-secondary mt-0.5">
                Verify suggested automatic mappings and correct any headers below
              </p>
            </div>
            {inspectionData.sheets?.length > 1 && (
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-txt-primary">Worksheet:</span>
                <select
                  value={selectedSheet}
                  onChange={(e) => setSelectedSheet(e.target.value)}
                  className="text-xs p-1.5 border border-brd rounded bg-bg-main"
                >
                  {inspectionData.sheets.map((s: any) => (
                    <option key={s.name} value={s.name}>
                      {s.name} ({s.total_rows_estimated} rows)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Sample Rows Preview */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-txt-primary uppercase tracking-wider">
              File Headers & Sample Rows Detected
            </h3>
            <div className="overflow-x-auto border border-brd rounded-lg">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-bg-highlight border-b border-brd text-txt-secondary">
                  <tr>
                    {inspectionData.sheets[0]?.headers?.map((h: string, idx: number) => (
                      <th key={idx} className="px-3 py-2 font-semibold whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-brd-subtle">
                  {inspectionData.sheets[0]?.sample_rows?.slice(0, 3).map((r: any[], rIdx: number) => (
                    <tr key={rIdx}>
                      {r.map((c: any, cIdx: number) => (
                        <td key={cIdx} className="px-3 py-1.5 text-txt-primary whitespace-nowrap">
                          {c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Column Mapping Selectors */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-txt-primary uppercase tracking-wider">
              Target Database Fields
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inspectionData.canonical_fields?.map((field: string) => {
                const availableHeaders = inspectionData.sheets[0]?.headers || [];
                return (
                  <div key={field} className="p-3 rounded-lg bg-bg-highlight border border-brd flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-txt-primary block">
                        {canonicalFieldLabels[field] || field}
                      </span>
                      <span className="text-[10px] text-txt-muted">Canonical: {field}</span>
                    </div>
                    <select
                      value={columnMapping[field] || ''}
                      onChange={(e) =>
                        setColumnMapping({
                          ...columnMapping,
                          [field]: e.target.value,
                        })
                      }
                      className="text-xs p-1.5 border border-brd rounded bg-white max-w-xs focus:ring-1 focus:ring-brand-blue"
                    >
                      <option value="">-- Do Not Map --</option>
                      {availableHeaders.map((h: string) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-brd">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-brd text-txt-secondary hover:bg-bg-highlight flex items-center space-x-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              onClick={handleValidatePreview}
              disabled={isValidating}
              className="px-5 py-2 text-xs font-medium rounded-lg bg-navy-900 text-white hover:bg-navy-800 transition-colors flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
            >
              {isValidating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Validating Constraints...</span>
                </>
              ) : (
                <>
                  <span>Validate & Preview Records</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: PREVIEW & VALIDATION */}
      {step === 3 && previewData && (
        <div className="bg-white p-6 rounded-xl border border-brd shadow-subtle space-y-6">
          <div>
            <h2 className="text-sm font-bold text-txt-primary">Data Validation & Conflict Preview</h2>
            <p className="text-xs text-txt-secondary mt-0.5">
              Review records categorized for creation, update, or rejection prior to database commitment
            </p>
          </div>

          {/* Counts Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-bg-highlight border border-brd">
              <span className="text-xs text-txt-muted uppercase font-semibold">Processed</span>
              <p className="text-xl font-bold text-txt-primary mt-1">{previewData.total_rows_processed}</p>
            </div>
            <div className="p-4 rounded-xl bg-status-success/10 border border-status-success/30">
              <span className="text-xs text-[#3C644E] uppercase font-semibold">New Records</span>
              <p className="text-xl font-bold text-status-success mt-1">{previewData.create_count}</p>
            </div>
            <div className="p-4 rounded-xl bg-status-info/10 border border-status-info/30">
              <span className="text-xs text-brand-blue uppercase font-semibold">Update Conflicts</span>
              <p className="text-xl font-bold text-brand-blue mt-1">{previewData.update_count}</p>
            </div>
            <div className="p-4 rounded-xl bg-status-danger/10 border border-status-danger/30">
              <span className="text-xs text-status-danger uppercase font-semibold">Rejected Rows</span>
              <p className="text-xl font-bold text-status-danger mt-1">{previewData.rejected_count}</p>
            </div>
          </div>

          {/* Rejected Rows Log if any */}
          {previewData.rejected_rows?.length > 0 && (
            <div className="p-4 rounded-xl bg-status-danger/10 border border-status-danger/30 space-y-2">
              <h3 className="text-xs font-bold text-status-danger flex items-center">
                <AlertCircle className="w-4 h-4 mr-1.5" />
                Rejected Rows ({previewData.rejected_count} errors):
              </h3>
              <div className="max-h-40 overflow-y-auto space-y-1 text-xs">
                {previewData.rejected_rows.map((rej: any, idx: number) => (
                  <div key={idx} className="p-2 rounded bg-white text-txt-primary">
                    <span className="font-semibold text-status-danger">Row {rej.row_number}: </span>
                    <span>{rej.errors?.join('; ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Records Table Preview */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-txt-primary uppercase tracking-wider">
              Sample Valid Records to Ingest (First 10 of {previewData.create_count})
            </h3>
            <div className="overflow-x-auto border border-brd rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-bg-highlight border-b border-brd text-txt-secondary">
                  <tr>
                    <th className="px-4 py-2 font-semibold">Roll No</th>
                    <th className="px-4 py-2 font-semibold">Name</th>
                    <th className="px-4 py-2 font-semibold">Email</th>
                    <th className="px-4 py-2 font-semibold">Dept</th>
                    <th className="px-4 py-2 font-semibold">Sem</th>
                    <th className="px-4 py-2 font-semibold">CGPA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brd-subtle">
                  {previewData.to_create_preview?.slice(0, 10).map((r: any, idx: number) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 font-medium text-txt-primary">{r.roll_number}</td>
                      <td className="px-4 py-2 text-txt-primary">{r.full_name}</td>
                      <td className="px-4 py-2 text-txt-secondary">{r.email}</td>
                      <td className="px-4 py-2 text-txt-secondary">{r.department_code || 'CSE'}</td>
                      <td className="px-4 py-2 text-txt-secondary">{r.semester}</td>
                      <td className="px-4 py-2 text-txt-secondary">{r.cgpa}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-brd">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-brd text-txt-secondary hover:bg-bg-highlight flex items-center space-x-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Mapping</span>
            </button>
            <button
              onClick={handleExecuteImport}
              disabled={isExecuting || (previewData.create_count === 0 && previewData.update_count === 0)}
              className="px-5 py-2 text-xs font-medium rounded-lg bg-navy-900 text-white hover:bg-navy-800 transition-colors flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
            >
              {isExecuting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Executing Transaction...</span>
                </>
              ) : (
                <>
                  <Database className="w-3.5 h-3.5 text-brand-sage" />
                  <span>Commit Records to Database</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: SUCCESS SUMMARY */}
      {step === 4 && executionResult && (
        <div className="bg-white p-8 rounded-xl border border-brd shadow-subtle max-w-xl mx-auto text-center space-y-6">
          <div className="w-14 h-14 rounded-full bg-status-success/15 border border-status-success/30 mx-auto flex items-center justify-center text-status-success">
            <CheckCircle className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-txt-primary">Import Batch Successfully Persisted</h2>
            <p className="text-xs text-txt-secondary mt-1">
              {executionResult.created_count} student records created, {executionResult.updated_count} records updated.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-bg-highlight border border-brd text-xs text-txt-secondary space-y-1">
            <p>
              Job ID: <strong className="text-txt-primary">{executionResult.import_job_id}</strong>
            </p>
            <p>Records are immediately available across student profiles, directories, and analytics.</p>
          </div>

          <div className="flex justify-center space-x-3 pt-2">
            <Link
              to="/students"
              className="px-4 py-2 text-xs font-medium rounded-lg bg-navy-900 text-white hover:bg-navy-800 transition-colors shadow-sm"
            >
              View Student Directory
            </Link>
            <Link
              to="/admin/import-history"
              className="px-4 py-2 text-xs font-medium rounded-lg border border-brd text-txt-primary hover:bg-bg-highlight transition-colors"
            >
              View Import History
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
