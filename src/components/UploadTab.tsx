import { useState, useRef } from 'react';

type AIResult = {
    title: string;
    author: string;
    funding_agency: string;
    date_collected: string;
    geographic_location: string;
    variables_defined: string;
    file_url: string;
    description: string;
};

export default function UploadTab() {
    const [file, setFile] = useState<File | null>(null);
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [metadata, setMetadata] = useState<AIResult | null>(null);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleGenerate = async () => {
        if (!file) {
            setError("Please select a CSV file first.");
            return;
        }
        setLoading(true);
        setError(null);
        setSuccess(false);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("description", description);

        try {
            const res = await fetch("/api/upload-and-generate", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Something went wrong.");
            }

            const data: AIResult = await res.json();
            setMetadata(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFieldChange = (field: keyof AIResult, value: string) => {
        if (metadata) {
            setMetadata({ ...metadata, [field]: value });
        }
    };

    const saveMetadata = async () => {
        if (!metadata) return;
        setSubmitLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/save-metadata", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(metadata)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error?.join(", ") || "Failed to save metadata.");
            }

            setSuccess(true);
            setMetadata(null);
            setFile(null);
            setDescription('');
            if (fileInputRef.current) fileInputRef.current.value = '';

        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitLoading(false);
        }
    };

    const isFormInvalid = metadata && (!metadata.title?.trim() || !metadata.author?.trim() || !metadata.funding_agency?.trim());

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            {/* Upload Box */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 backdrop-blur-sm shadow-xl">
                <h2 className="text-xl font-semibold mb-6 flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">1</div>
                    <span>Provide Dataset Details</span>
                </h2>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Dataset File (CSV only)</label>
                        <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-600 border-dashed rounded-xl cursor-pointer bg-slate-800/50 hover:bg-slate-700/50 transition-colors">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <svg className="w-8 h-8 mb-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                                    <p className="mb-2 text-sm text-slate-400"><span className="font-semibold text-indigo-400">Click to upload</span> or drag and drop</p>
                                    <p className="text-xs text-slate-500">{file ? file.name : "CSV files only"}</p>
                                </div>
                                <input ref={fileInputRef} type="file" className="hidden" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Briefly describe this dataset</label>
                        <textarea
                            rows={3}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none resize-none"
                            placeholder="E.g., Global climate anomalies recorded daily from 1990 to 2020 by the NSF..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={loading || !file}
                        className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white rounded-lg font-medium shadow-lg shadow-indigo-500/25 transition-all outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                    >
                        {loading ? (
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : "Generate Metadata with AI"}
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-lg flex items-start space-x-3">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span className="text-sm">{error}</span>
                </div>
            )}

            {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 p-4 rounded-lg flex items-center space-x-3 shadow-lg shadow-emerald-500/10 animate-in slide-in-from-top-2">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span className="font-medium text-sm">Successfully inserted dataset metadata into the repository!</span>
                </div>
            )}

            {/* Editable Metadata UI */}
            {metadata && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 backdrop-blur-sm shadow-xl animate-in fade-in zoom-in-95 duration-300">
                    <h2 className="text-xl font-semibold mb-6 flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">2</div>
                        <span>Review & Refine Metadata</span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-medium text-slate-300 mb-1">Title <span className="text-red-400">*</span></label>
                            <input
                                type="text"
                                value={metadata.title}
                                onChange={e => handleFieldChange('title', e.target.value)}
                                className={`w-full bg-slate-900 border ${!metadata.title?.trim() ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-indigo-500'} rounded-lg p-2.5 text-slate-200 focus:ring-2 focus:border-transparent transition-all outline-none`}
                            />
                            {!metadata.title?.trim() && <p className="text-red-400 text-xs mt-1 font-medium">Title is required</p>}
                        </div>

                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-slate-300 mb-1">Author <span className="text-red-400">*</span></label>
                            <input
                                type="text"
                                value={metadata.author}
                                onChange={e => handleFieldChange('author', e.target.value)}
                                className={`w-full bg-slate-900 border ${!metadata.author?.trim() ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-indigo-500'} rounded-lg p-2.5 text-slate-200 focus:ring-2 focus:border-transparent transition-all outline-none`}
                            />
                            {!metadata.author?.trim() && <p className="text-red-400 text-xs mt-1 font-medium">Author is required</p>}
                        </div>

                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-slate-300 mb-1">Funding Agency <span className="text-red-400">*</span></label>
                            <input
                                type="text"
                                value={metadata.funding_agency}
                                onChange={e => handleFieldChange('funding_agency', e.target.value)}
                                className={`w-full bg-slate-900 border ${!metadata.funding_agency?.trim() ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-indigo-500'} rounded-lg p-2.5 text-slate-200 focus:ring-2 focus:border-transparent transition-all outline-none`}
                            />
                            {!metadata.funding_agency?.trim() && <p className="text-red-400 text-xs mt-1 font-medium">Funding agency is required</p>}
                        </div>

                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-slate-300 mb-1">Date Collected</label>
                            <input
                                type="text"
                                value={metadata.date_collected || ''}
                                onChange={e => handleFieldChange('date_collected', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                            />
                        </div>

                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-slate-300 mb-1">Geographic Location</label>
                            <input
                                type="text"
                                value={metadata.geographic_location || ''}
                                onChange={e => handleFieldChange('geographic_location', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                            />
                        </div>

                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-medium text-slate-300 mb-1">Variables Defined</label>
                            <textarea
                                rows={2}
                                value={metadata.variables_defined || ''}
                                onChange={e => handleFieldChange('variables_defined', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none resize-none"
                            />
                        </div>

                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-medium text-slate-300 mb-1 text-slate-400">Public File URL (Read-only)</label>
                            <input
                                type="text"
                                readOnly
                                value={metadata.file_url}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-500 opacity-80 cursor-not-allowed selection:bg-slate-700"
                            />
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-700/50 flex justify-end">
                        <button
                            onClick={saveMetadata}
                            disabled={submitLoading || (isFormInvalid ? true : false)}
                            className="py-3 px-8 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-lg shadow-emerald-600/25 transition-all outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                            {submitLoading ? (
                                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    <span>Submit to Database</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
