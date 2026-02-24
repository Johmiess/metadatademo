import { useState, useEffect } from 'react';

type DatasetResult = {
    id: string;
    title: string;
    author: string;
    funding_agency: string;
    date_collected: string;
    geographic_location: string;
    variables_defined: string;
    file_url: string;
    description: string;
    created_at: string;
};

export default function SearchTab() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<DatasetResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initial load
    useEffect(() => {
        fetchResults('');
    }, []);

    const fetchResults = async (q: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
            if (!res.ok) {
                throw new Error("Failed to fetch records.");
            }
            const data = await res.json();
            setResults(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Debounce search
    useEffect(() => {
        const handler = setTimeout(() => {
            fetchResults(query);
        }, 400);

        return () => {
            clearTimeout(handler);
        };
    }, [query]);

    return (
        <div className="space-y-8">
            {/* Search Input */}
            <div className="relative max-w-2xl mx-auto shadow-2xl">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="block w-full pl-12 pr-4 py-4 bg-slate-800 border-2 border-slate-700/80 rounded-2xl text-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all selection:bg-indigo-500/30"
                    placeholder="Search by title, author, or description phrase..."
                />
                {loading && (
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                        <svg className="animate-spin h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                )}
            </div>

            {error && (
                <div className="text-center text-red-400 p-4">{error}</div>
            )}

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                {results.map((item) => (
                    <div key={item.id} className="bg-slate-800/60 border border-slate-700/60 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-500/30 transition-all duration-300 flex flex-col group will-change-transform hover:-translate-y-1">
                        <div className="p-6 flex-grow flex flex-col h-full relative">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold text-slate-100 group-hover:text-indigo-400 transition-colors leading-tight">{item.title}</h3>
                            </div>

                            <div className="space-y-3 mb-6 flex-grow">
                                {item.author && (
                                    <div className="flex items-center space-x-2 text-sm text-slate-400">
                                        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                        <span className="truncate">{item.author}</span>
                                    </div>
                                )}

                                {item.description && (
                                    <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed">
                                        {item.description}
                                    </p>
                                )}
                            </div>

                            <div className="mt-auto pt-4 border-t border-slate-700/50">
                                <a
                                    href={item.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-2.5 px-4 bg-slate-700/50 hover:bg-slate-700 text-indigo-300 hover:text-indigo-200 rounded-lg font-medium text-sm flex items-center justify-center space-x-2 transition-colors border border-slate-600/50 hover:border-indigo-500/30 group/btn"
                                >
                                    <svg className="w-4 h-4 transition-transform group-hover/btn:-translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                    <span>Download CSV</span>
                                </a>
                            </div>
                        </div>
                    </div>
                ))}
                {results.length === 0 && !loading && !error && (
                    <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-700 rounded-2xl">
                        <div className="inline-flex w-16 h-16 rounded-full bg-slate-800 items-center justify-center mb-4 text-slate-500">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                        </div>
                        <h3 className="text-xl font-medium text-slate-300">No datasets found</h3>
                        <p className="mt-2 text-slate-500 text-sm">Try using different search criteria or upload a new dataset.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
