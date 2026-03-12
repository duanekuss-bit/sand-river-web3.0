import React, { useState, useMemo, useEffect } from 'react';
import { 
  MapPin, Users, Clock, BookOpen, Filter, History, Home, BarChart3, Target, Upload, 
  CheckCircle2, Cloud, CloudOff, CloudLightning, Loader2, Camera, ExternalLink, 
  Image as ImageIcon, BookMarked, ChevronDown, ChevronUp, BookText, Award, Wind, Search, AlertTriangle
} from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// Firebase Imports
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';

// =========================================================================
// --- FIREBASE & ROWY INITIALIZATION ---

// For Firebase JS SDK v7.20.0 and later, measurementId is optional

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCgRN8WXDabr6OVNXO8AliOOXfiO9uTEP8",
  authDomain: "sand-river-hunting-history-65.firebaseapp.com",
  projectId: "sand-river-hunting-history-65",
  storageBucket: "sand-river-hunting-history-65.appspot.com",
  messagingSenderId: "506475795580",
  appId: "1:506475795580:web:991142b947315fbdae25f9",
  measurementId: "G-WQSL0B3TDE"
};


// *** EXACT ROWY TABLE NAME ***
const ROWY_TABLE_NAME = "testtable1"; 
// =========================================================================

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Default Curated Highlights (Fallback data)
const defaultStats = [
  { year: 1961, hunter: "John Godava", sex: "Buck", location: "Pollock's Lowland", time: "AM", party: 3, weather: "Clear/Cold", note: "The First One. Purchased South 40 for $40 + timber value.", story: "The foundation of Sand River was laid by a cast of characters as colorful as the Minnesota woods themselves. In the spring of 1961, they purchased the 'South 40 Acres' for $40 plus $175 for timber value.", partyPhoto: "https://images.unsplash.com/photo-1520699697851-3d29cb1f17bd?q=80&w=800&auto=format&fit=crop", harvestPhoto: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=800&auto=format&fit=crop" },
  { year: 1964, hunter: "No Harvest", sex: "N/A", location: "N/A", time: "N/A", party: 4, weather: "Cold", note: "Skunked Year #1. The woods win for the first time." },
  { year: 1982, hunter: "Doug Smith", sex: "Buck", location: "Hatchet Ridge", time: "AM", party: 6, weather: "Crisp", note: "Doug's first Sand River deer. A pivotal generational bridge." },
  { year: 2025, hunter: "No Harvest", sex: "N/A", location: "N/A", time: "N/A", party: 10, weather: "Freezing", note: "Skunked Year #6. The 65th Anniversary. A roster of 10 hunters proves the legacy lives on." }
];

const COLORS = ['#047857', '#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5', '#ecfdf5'];

const App = () => {
  const [statsData, setStatsData] = useState(defaultStats);
  const [isDataImported, setIsDataImported] = useState(false);
  const [cloudStatus, setCloudStatus] = useState('connecting'); 
  const [dbErrorMessage, setDbErrorMessage] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('archive');
  const [filterSex, setFilterSex] = useState('All');
  const [filterDecade, setFilterDecade] = useState('All');
  const [activeYearbookYear, setActiveYearbookYear] = useState(null);

  useEffect(() => {
    if (!db) return;
    
    const colRef = collection(db, ROWY_TABLE_NAME);
    
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const records = [];
      snapshot.forEach((doc) => {
        const raw = doc.data();
        
        // --- THE SANITIZER ---
        records.push({
          id: doc.id,
          year: Number(raw.year) || 0,
          hunter: raw.hunter ? String(raw.hunter) : "Unknown",
          sex: raw.sex ? String(raw.sex) : "Unk",
          location: raw.location ? String(raw.location) : "Unknown",
          weather: raw.weather ? String(raw.weather) : "",
          party: Number(raw.party) || 0,
          note: raw.note ? String(raw.note) : "",
          story: raw.story ? String(raw.story) : null,
          partyPhoto: raw.partyPhoto || null,
          harvestPhoto: raw.harvestPhoto || null,
          yearlyAlbum: raw.yearlyAlbum ? String(raw.yearlyAlbum) : null
        });
      });

      if (records.length > 0) {
        const sortedData = records.sort((a, b) => a.year - b.year);
        setStatsData(sortedData);
        setIsDataImported(true);
        setCloudStatus('synced');
      } else {
        setCloudStatus('empty');
      }
    }, (error) => {
      console.error("Firestore error:", error);
      setCloudStatus('error');
      setDbErrorMessage(error.message);
    });

    return () => unsubscribe();
  }, []);

  const decades = useMemo(() => {
    const decs = new Set(statsData.map(item => Math.floor(item.year / 10) * 10).filter(y => y > 0));
    return Array.from(decs).sort();
  }, [statsData]);

  const filteredData = useMemo(() => {
    return statsData.filter(item => {
      const matchesSearch = Object.values(item).some(val => 
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      );
      const matchesSex = filterSex === 'All' || item.sex === filterSex;
      const itemDecade = Math.floor(item.year / 10) * 10;
      const matchesDecade = filterDecade === 'All' || itemDecade === parseInt(filterDecade);
      return matchesSearch && matchesSex && matchesDecade;
    });
  }, [statsData, searchTerm, filterSex, filterDecade]);

  const hunterStats = useMemo(() => {
    const stats = {};
    statsData.forEach(d => {
      if (d.hunter === "No Harvest" || d.hunter === "Unknown" || d.hunter === "Multiple" || d.hunter.includes("Unknown")) return;
      if (!stats[d.hunter]) stats[d.hunter] = 0;
      stats[d.hunter]++;
    });
    return Object.entries(stats).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [statsData]);

  const timelineData = useMemo(() => {
    const intervals = {};
    statsData.forEach(d => {
      if (!d.year) return;
      const interval = Math.floor(d.year / 5) * 5;
      if (!intervals[interval]) intervals[interval] = { year: `${interval}s`, harvests: 0, hunters: d.party || 5 };
      if (d.hunter !== "No Harvest") intervals[interval].harvests += 1;
    });
    return Object.values(intervals).sort((a, b) => a.year.localeCompare(b.year));
  }, [statsData]);

  const sexStats = useMemo(() => {
    const stats = { Buck: 0, Doe: 0 };
    statsData.forEach(d => {
      if (d.sex === "Buck") stats.Buck++;
      if (d.sex.includes("Doe") || d.sex.includes("Fawn")) stats.Doe++;
    });
    return [{ name: 'Bucks', value: stats.Buck }, { name: 'Does', value: stats.Doe }];
  }, [statsData]);

  const groupedTimelineEvents = useMemo(() => {
    const eventsMap = new Map();
    statsData.forEach(item => {
      if (!item.year) return;
      
      if (!eventsMap.has(item.year)) {
        eventsMap.set(item.year, {
          year: item.year,
          weather: item.weather,
          party: item.party,
          note: item.note,
          story: item.story,               
          partyPhoto: item.partyPhoto,     
          harvestPhoto: item.harvestPhoto, 
          yearlyAlbum: item.yearlyAlbum, 
          locations: new Set(),
          harvests: []
        });
      }
      
      const event = eventsMap.get(item.year);
      
      if (!event.story && item.story) event.story = item.story;
      if (!event.yearlyAlbum && item.yearlyAlbum) event.yearlyAlbum = item.yearlyAlbum;
      
      if (!event.partyPhoto && item.partyPhoto) event.partyPhoto = Array.isArray(item.partyPhoto) ? item.partyPhoto[0]?.downloadURL : item.partyPhoto;
      if (!event.harvestPhoto && item.harvestPhoto) event.harvestPhoto = Array.isArray(item.harvestPhoto) ? item.harvestPhoto[0]?.downloadURL : item.harvestPhoto;

      if (item.location && item.location !== 'N/A' && item.location !== 'Varies') event.locations.add(item.location);
      if (item.hunter !== "No Harvest") {
        event.harvests.push({
          hunter: item.hunter,
          sex: item.sex,
          location: item.location
        });
      }
    });
    return Array.from(eventsMap.values()).sort((a,b) => b.year - a.year);
  }, [statsData]);

  const totalHarvests = statsData.filter(d => d.hunter !== "No Harvest").length;
  const skunkedYears = groupedTimelineEvents.filter(e => e.harvests.length === 0).length;

  return (
    <div className="min-h-screen bg-[#f8f7f4] text-stone-900 font-sans">
      <nav className="bg-[#1e312a] text-[#e8f0ed] p-5 sticky top-0 z-50 shadow-xl border-b border-emerald-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-800 rounded-lg flex items-center justify-center shadow-lg border border-emerald-700">
              <History className="text-emerald-50" size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-2xl font-black tracking-tight leading-none uppercase">Sand River Hilton</h1>
                {cloudStatus === 'synced' && <Cloud className="text-emerald-400" size={16} title="Connected to Rowy/Cloud" />}
                {cloudStatus === 'connecting' && <Loader2 className="text-amber-400 animate-spin" size={16} title="Connecting..." />}
                {cloudStatus === 'empty' && <AlertTriangle className="text-amber-400" size={16} title="Table Empty" />}
                {cloudStatus === 'error' && <CloudOff className="text-red-400" size={16} title="Offline Mode" />}
              </div>
              <p className="text-[10px] tracking-[0.2em] font-bold text-emerald-500 mt-1 uppercase">65-Year Master Chronology</p>
            </div>
          </div>
          <div className="flex bg-[#14231d] p-1 rounded-full border border-emerald-900/50 overflow-x-auto w-full md:w-auto">
            <TabButton active={activeTab === 'archive'} onClick={() => setActiveTab('archive')} label="The Ledger" icon={<BookOpen size={14}/>} />
            <TabButton active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} label="Analytics" icon={<BarChart3 size={14}/>} />
            <TabButton active={activeTab === 'chronology'} onClick={() => setActiveTab('chronology')} label="Timeline" icon={<Clock size={14}/>} />
            <TabButton active={activeTab === 'yearbook'} onClick={() => setActiveTab('yearbook')} label="The Book" icon={<BookMarked size={14}/>} />
            <TabButton active={activeTab === 'gallery'} onClick={() => setActiveTab('gallery')} label="Photo Vault" icon={<Camera size={14}/>} />
          </div>
        </div>
      </nav>

      {/* --- DIAGNOSTIC BANNERS --- */}
      {cloudStatus === 'error' && (
        <div className="bg-red-600 text-white p-4 text-center font-bold text-sm shadow-inner flex items-center justify-center gap-2">
          <AlertTriangle size={18} />
          FIREBASE BLOCKED CONNECTION: {dbErrorMessage} (Did you publish the Public Read Rules?)
        </div>
      )}
      
      {cloudStatus === 'empty' && (
        <div className="bg-amber-500 text-amber-950 p-4 text-center font-bold text-sm shadow-inner flex items-center justify-center gap-2">
          <AlertTriangle size={18} />
          CONNECTED PERFECTLY, BUT TABLE '{ROWY_TABLE_NAME}' IS EMPTY OR DOESN'T EXIST. CHECK YOUR ROWY TABLE NAME!
        </div>
      )}

      {cloudStatus === 'synced' && (
        <div className="bg-emerald-500 text-white p-2 text-center font-bold text-xs shadow-inner flex items-center justify-center gap-2">
          <CheckCircle2 size={14} />
          SUCCESSFULLY IMPORTED {statsData.length} RECORDS FROM ROWY!
        </div>
      )}
      {/* ------------------------- */}

      <main className="max-w-7xl mx-auto p-4 md:p-10">
        
        {activeTab !== 'gallery' && activeTab !== 'yearbook' && (
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <HeroStat label="Establishment" value="1961" sub="Nov 1st Purchase" color="emerald" />
            <HeroStat label="Harvest Count" value={isDataImported ? totalHarvests : "185+"} sub={isDataImported ? "Confirmed Records" : "Est. Total History"} color="amber" />
            <HeroStat label="Skunked Years" value={isDataImported ? skunkedYears : "6"} sub="Total Recorded" color="stone" />
            <HeroStat label="Tradition Age" value="65" sub="Continuous Years" color="blue" />
          </section>
        )}

        {activeTab === 'archive' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden flex flex-col h-full">
                <div className="p-6 border-b border-stone-100 bg-stone-50/50">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <div>
                      <h2 className="text-2xl font-serif font-bold text-stone-800 italic">"The Meat Pole"</h2>
                      <p className="text-sm text-stone-500">{isDataImported ? `Displaying ${statsData.length} live Rowy records` : "Showing 4 Offline Placeholders"}</p>
                    </div>
                    <div className="relative w-full md:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                      <input 
                        className="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
                        placeholder="Search notes, hunters..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left">
                    <thead className="bg-stone-50 text-[11px] uppercase tracking-widest text-stone-400 font-bold border-b">
                      <tr>
                        <th className="px-6 py-4">Year</th>
                        <th className="px-6 py-4">Hunter</th>
                        <th className="px-6 py-4">Stand</th>
                        <th className="px-6 py-4">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {filteredData.length > 0 ? filteredData.map((item, i) => {
                        return (
                        <tr key={i} className="hover:bg-emerald-50/50 transition-colors group">
                          <td className="px-6 py-4"><span className="font-serif font-black text-lg text-emerald-950">{item.year}</span></td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-stone-800">{item.hunter}</p>
                            <p className="text-[10px] text-stone-400 mt-0.5">Party: {item.party}</p>
                          </td>
                          <td className="px-6 py-4"><div className="text-sm text-stone-600">{item.location}</div></td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${item.sex === 'Buck' ? 'bg-amber-100 text-amber-800 border border-amber-200' : item.sex.includes('Doe') ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-stone-100 text-stone-400 border border-stone-200'}`}>
                              {item.sex}
                            </span>
                          </td>
                        </tr>
                      )}) : (
                        <tr><td colSpan="4" className="text-center py-10 text-stone-400 italic">No records match your filters.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-6">
              {isDataImported && (
                <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-200 shadow-sm flex items-start gap-4">
                  <CheckCircle2 className="text-emerald-600 shrink-0" size={24} />
                  <div>
                    <h3 className="font-bold text-emerald-900">Rowy Sync Active</h3>
                    <p className="text-emerald-700 text-xs mt-1">Successfully synced <strong>{statsData.length} records</strong>. Edits made in Rowy will appear here instantly.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'yearbook' && (
          <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto">
            <div className="w-full md:w-64 shrink-0">
              <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm sticky top-32 max-h-[80vh] overflow-y-auto">
                <h3 className="font-serif font-black text-xl text-emerald-950 mb-6 flex items-center gap-2"><BookMarked size={20} className="text-emerald-700" /> Chapters</h3>
                <div className="space-y-1">
                  {groupedTimelineEvents.map((event) => {
                    const isActive = (activeYearbookYear || groupedTimelineEvents[0]?.year) === event.year;
                    return (
                      <button
                        key={event.year}
                        onClick={() => setActiveYearbookYear(event.year)}
                        className={`w-full text-left px-4 py-3 rounded-xl transition-all font-bold text-sm ${isActive ? 'bg-emerald-800 text-white shadow-md' : 'text-stone-600 hover:bg-emerald-50 hover:text-emerald-800'}`}
                      >
                        {event.year} Season
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex-1">
              {groupedTimelineEvents
                .filter(e => e.year === (activeYearbookYear || groupedTimelineEvents[0]?.year))
                .map(event => {
                  const narrative = event.story || "The full story of this season has not yet been transcribed into the digital archive.";
                  return (
                    <div key={event.year} className="bg-white rounded-[2rem] border border-stone-200 shadow-xl overflow-hidden animate-in fade-in duration-500">
                      <div className="bg-[#1e312a] p-10 md:p-16 text-center relative overflow-hidden">
                        <div className="relative z-10">
                          <p className="text-emerald-400 font-bold uppercase tracking-[0.3em] text-xs mb-4">Chapter {event.year > 1960 ? event.year - 1960 : 'Classic'}</p>
                          <h2 className="text-5xl md:text-7xl font-serif font-black text-white mb-6">{event.year}</h2>
                        </div>
                      </div>

                      <div className="p-8 md:p-16">
                        <div className="mb-16">
                          <p className="font-serif leading-loose text-stone-700 text-lg whitespace-pre-line first-letter:text-7xl first-letter:font-black first-letter:text-emerald-900 first-letter:mr-3 first-letter:float-left">
                            {narrative}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <h4 className="font-bold text-stone-800 uppercase tracking-widest text-xs border-b border-stone-200 pb-2">The Hunting Party</h4>
                            {event.partyPhoto ? (
                              <img src={event.partyPhoto} alt={`${event.year} Hunting Party`} className="w-full h-72 object-cover rounded-2xl shadow-md border border-stone-200" />
                            ) : (
                              <div className="w-full h-72 bg-stone-50 rounded-2xl border-2 border-dashed border-stone-300 flex flex-col items-center justify-center text-stone-400">
                                <Users size={32} className="mb-2 opacity-30" />
                                <span className="text-xs font-bold">Party Photo Missing</span>
                              </div>
                            )}
                          </div>

                          <div className="space-y-3">
                            <h4 className="font-bold text-stone-800 uppercase tracking-widest text-xs border-b border-stone-200 pb-2">The Harvest</h4>
                            {event.harvestPhoto ? (
                              <img src={event.harvestPhoto} alt={`${event.year} Harvest`} className="w-full h-72 object-cover rounded-2xl shadow-md border border-stone-200" />
                            ) : (
                              <div className="w-full h-72 bg-stone-50 rounded-2xl border-2 border-dashed border-stone-300 flex flex-col items-center justify-center text-stone-400">
                                <Camera size={32} className="mb-2 opacity-30" />
                                <span className="text-xs font-bold">Harvest Photo Missing</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {event.yearlyAlbum && (
                          <div className="mt-12 text-center">
                            <a href={event.yearlyAlbum} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 bg-stone-100 hover:bg-emerald-50 text-stone-700 hover:text-emerald-800 px-8 py-4 rounded-full font-bold text-sm transition-all border border-stone-200 hover:border-emerald-200 shadow-sm">
                              <ImageIcon size={18} /> View Complete {event.year} Photo Album <ExternalLink size={16} className="opacity-50" />
                            </a>
                          </div>
                        )}

                        <div className="mt-16 bg-stone-50 p-8 rounded-3xl border border-stone-200">
                          <h4 className="font-bold text-emerald-900 uppercase tracking-widest text-sm mb-6 flex items-center gap-2">
                            <Award size={18} /> Official Record
                          </h4>
                          {event.harvests.length === 0 ? (
                            <p className="text-stone-500 italic">No harvests recorded for this season.</p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {event.harvests.map((h, idx) => (
                                <div key={idx} className="bg-white p-4 rounded-xl border border-stone-200 flex items-center gap-4 shadow-sm">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs ${h.sex === 'Buck' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                    {h.sex.substring(0, 1)}
                                  </div>
                                  <div>
                                    <p className="font-bold text-stone-800 leading-tight">{h.hunter}</p>
                                    <p className="text-[10px] text-stone-500 flex items-center gap-1 mt-1"><MapPin size={10}/> {h.location}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const TabButton = ({ active, onClick, label, icon }) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${active ? 'bg-emerald-800 text-white shadow-lg' : 'text-emerald-500 hover:text-emerald-100'}`}>
    {icon} {label}
  </button>
);

const HeroStat = ({ label, value, sub, color }) => {
  const colors = { emerald: "text-emerald-900 border-emerald-100 bg-white", amber: "text-amber-900 border-amber-100 bg-white", stone: "text-stone-900 border-stone-100 bg-white", blue: "text-blue-900 border-blue-100 bg-white" };
  return (
    <div className={`p-6 rounded-3xl border-2 shadow-sm ${colors[color]}`}>
      <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">{label}</p>
      <p className="text-3xl font-serif font-black">{value}</p>
      <p className="text-xs text-stone-400 font-bold mt-1 uppercase tracking-tighter">{sub}</p>
    </div>
  );
};

export default App;
