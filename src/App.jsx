import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, 
  MapPin, 
  Users, 
  Calendar, 
  Search, 
  Award,
  Wind,
  Clock,
  BookOpen,
  Filter,
  History,
  Home,
  BarChart3,
  Target,
  Upload,
  CheckCircle2,
  Cloud,
  CloudOff,
  CloudLightning,
  Loader2,
  Camera,
  ExternalLink,
  Image as ImageIcon,
  BookMarked,
  ChevronDown,
  ChevronUp,
  BookText
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Firebase Imports
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, writeBatch, onSnapshot } from 'firebase/firestore';

// ==========================================
// --- FIREBASE INITIALIZATION ---
// PASTE YOUR KEYS FROM STEP 1 INTO THIS SECTION:
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyCgRN8WXDabr6OVNXO8AliOOXfiO9uTEP8",
  authDomain: "sand-river-hunting-history-65.firebaseapp.com",
  projectId: "sand-river-hunting-history-65",
  storageBucket: "sand-river-hunting-history-65.appspot.com",
  messagingSenderId: "506475795580",
  appId: "1:506475795580:web:991142b947315fbdae25f9",
  measurementId: "G-WQSL0B3TDE"
};

const appId = 'sand-river-hilton-live'; // Do not change this line

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// ==========================================

// Default Curated Highlights - Updated with Mock Yearbook Data for 1961
const defaultStats = [
  { 
    year: 1961, 
    hunter: "John Godava", 
    sex: "Buck", 
    location: "Pollock's Lowland", 
    time: "AM", 
    party: 3, 
    weather: "Clear/Cold", 
    note: "The First One. Purchased South 40 for $40 + timber value.",
    story: "The foundation of Sand River was laid by a cast of characters as colorful as the Minnesota woods themselves. Daune Kuss, whose booming snore and relentless drive in the woods became legendary, and John \"Unc John\" Godava, the Polish hunting historian. In the spring of 1961, they purchased the 'South 40 Acres' for $40 plus $175 for timber value. That first year, John and Daune stayed in the first trailer brought onto the property, a 1947 Adams purchased for $75 from someone in the Lion's Club. John was the first to shoot a deer on the newly-purchased property. He was standing down in the lowlands just west of Polock's Point, when a nice 205 lb. buck came running towards him over the Point.",
    partyPhoto: "https://images.unsplash.com/photo-1520699697851-3d29cb1f17bd?q=80&w=800&auto=format&fit=crop", 
    harvestPhoto: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=800&auto=format&fit=crop"
  },
  { year: 1962, hunter: "John Godava", sex: "Buck", location: "Mickey's Ridge West", time: "AM", party: 3, weather: "Fair", note: "Purchased North 40. Property now 80 acres." },
  { year: 1963, hunter: "Daune Kuss", sex: "Doe", location: "Mickey's Ridge East", time: "AM", party: 3, weather: "30s", note: "The Great Shootout. Daune harvests 4 does. First year using a scope." },
  { year: 1964, hunter: "No Harvest", sex: "N/A", location: "N/A", time: "N/A", party: 4, weather: "Cold", note: "Skunked Year #1. The woods win for the first time." },
  { year: 1982, hunter: "Doug Smith", sex: "Buck", location: "Hatchet Ridge", time: "AM", party: 6, weather: "Crisp", note: "Doug's first Sand River deer. A pivotal generational bridge." },
  { year: 1991, hunter: "John Godava", sex: "Buck", location: "Spruce Swamp", time: "AM", party: 7, weather: "Record Herd", note: "John's first buck of a legendary 5-deer season." },
  { year: 2002, hunter: "Doug Smith", sex: "Buck", location: "Hatchet Ridge", time: "AM", party: 9, weather: "Clear", note: "Milestone: The 100th deer recorded on the property since 1961." },
  { year: 2011, hunter: "Jeramie Kuss", sex: "Buck", location: "West 80", time: "Dark", party: 11, weather: "Clear", note: "WWIII Saturday Evening Bombardment. Massive collective firing at dusk." },
  { year: 2017, hunter: "Chelsea Kuss", sex: "Buck", location: "Papa Daune's North", time: "8:40 AM", party: 9, weather: "Rain/Snow", note: "Chelsea puts it down with one shot." },
  { year: 2025, hunter: "No Harvest", sex: "N/A", location: "N/A", time: "N/A", party: 10, weather: "Freezing", note: "Skunked Year #6. The 65th Anniversary. A roster of 10 hunters proves the legacy lives on." },
];

const COLORS = ['#047857', '#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5', '#ecfdf5'];

// Utility to properly parse CSV rows handling quotes
const parseCSVRow = (str) => {
  const result = [];
  let curVal = '';
  let inQuotes = false;
  for (let i = 0; i < str.length; i++) {
    if (inQuotes) {
      if (str[i] === '"') {
        if (str[i + 1] === '"') { curVal += '"'; i++; } 
        else { inQuotes = false; }
      } else {
        curVal += str[i];
      }
    } else {
      if (str[i] === '"') { inQuotes = true; }
      else if (str[i] === ',') { result.push(curVal); curVal = ''; }
      else { curVal += str[i]; }
    }
  }
  result.push(curVal);
  return result;
};

const App = () => {
  // Application State
  const [user, setUser] = useState(null);
  const [statsData, setStatsData] = useState(defaultStats);
  const [isDataImported, setIsDataImported] = useState(false);
  const [cloudStatus, setCloudStatus] = useState('connecting'); 
  const [isUploading, setIsUploading] = useState(false);
  
  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('archive');
  const [filterSex, setFilterSex] = useState('All');
  const [filterDecade, setFilterDecade] = useState('All');
  const [activeYearbookYear, setActiveYearbookYear] = useState(null);
  const [expandedYears, setExpandedYears] = useState(new Set());

  const toggleYear = (year) => {
    setExpandedYears(prev => {
      const newSet = new Set(prev);
      if (newSet.has(year)) newSet.delete(year);
      else newSet.add(year);
      return newSet;
    });
  };

  // 1. Firebase Auth Setup
  useEffect(() => {
    if (!auth) {
      setCloudStatus('error');
      return;
    }
    
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (e) {
        console.error("Auth error", e);
        setCloudStatus('error');
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) setCloudStatus('error');
    });
    return () => unsubscribe();
  }, []);

  // 2. Firebase Database Sync (Rowy Collection Structure)
  useEffect(() => {
    if (!db || !user) return;
    
const colRef = collection(db, 'https://rowy.app/p/sand-river-hunting-history-65/table/testtable1');
    
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const records = [];
      snapshot.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() });
      });

      if (records.length > 0) {
        const sortedData = records.sort((a, b) => a.year - b.year);
        setStatsData(sortedData);
        setIsDataImported(true);
      }
      setCloudStatus('synced');
    }, (error) => {
      console.error("Firestore error:", error);
      setCloudStatus('error');
    });

    return () => unsubscribe();
  }, [user]);

  // CSV File Handler (Saves to Rowy Collection via Batch)
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      const lines = text.split('\n');
      const parsedData = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const row = parseCSVRow(lines[i].trim());
        if (row.length >= 6) {
          const yearMatch = row[0] ? row[0].match(/\d{4}/) : null;
          const year = yearMatch ? parseInt(yearMatch[0]) : 0;
          
          let hunter = row[1] ? row[1].trim() : 'Unknown';
          if (hunter.toUpperCase().includes('NO DEER')) hunter = 'No Harvest';

          parsedData.push({
            year: year,
            hunter: hunter,
            time: row[2] ? row[2].trim() : 'N/A',
            party: parseInt(row[3]) || 0,
            sex: row[4] ? row[4].trim() : 'N/A',
            location: row[5] ? row[5].trim() : 'Unknown',
            weekend: row[6] ? row[6].trim() : '',
            day: row[7] ? row[7].trim() : '',
            weather: row[8] ? row[8].trim() : '',
            note: row[8] ? row[8].trim() : 'Imported from CSV'
          });
        }
      }
      
      const sortedData = parsedData.sort((a, b) => a.year - b.year);
      
      if (db && user) {
        try {
          const colRef = collection(db, 'https://rowy.app/p/sand-river-hunting-history-65/table/testtable1');
          const batch = writeBatch(db);
          
          sortedData.forEach((record) => {
            const newDocRef = doc(colRef); 
            batch.set(newDocRef, record);
          });
          
          await batch.commit();
        } catch (error) {
          console.error("Error saving to cloud:", error);
          alert("Could not save to cloud, falling back to local view.");
          setStatsData(sortedData);
          setIsDataImported(true);
        }
      } else {
        setStatsData(sortedData);
        setIsDataImported(true);
      }
      
      setIsUploading(false);
      setActiveTab('archive'); 
    };
    reader.readAsText(file);
  };

  // Generate decades for filter based on active data
  const decades = useMemo(() => {
    const decs = new Set(statsData.map(item => Math.floor(item.year / 10) * 10));
    return Array.from(decs).sort();
  }, [statsData]);

  const filteredData = useMemo(() => {
    return statsData.filter(item => {
      const matchesSearch = Object.values(item).some(val => 
        val?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
      const matchesSex = filterSex === 'All' || item.sex === filterSex;
      const itemDecade = Math.floor(item.year / 10) * 10;
      const matchesDecade = filterDecade === 'All' || itemDecade === parseInt(filterDecade);
      
      return matchesSearch && matchesSex && matchesDecade;
    });
  }, [statsData, searchTerm, filterSex, filterDecade]);

  // Analytics Data Preparations
  const hunterStats = useMemo(() => {
    const stats = {};
    statsData.forEach(d => {
      if (d.hunter === "No Harvest" || d.hunter === "Unknown" || d.hunter === "Multiple" || d.hunter.includes("Unknown")) return;
      if (!stats[d.hunter]) stats[d.hunter] = 0;
      stats[d.hunter]++;
    });
    return Object.entries(stats)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [statsData]);

  const timelineData = useMemo(() => {
    const intervals = {};
    statsData.forEach(d => {
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
    return [
      { name: 'Bucks', value: stats.Buck },
      { name: 'Does', value: stats.Doe }
    ];
  }, [statsData]);

  // Group events by year for the chronological timeline
  const groupedTimelineEvents = useMemo(() => {
    const eventsMap = new Map();
    statsData.forEach(item => {
      if (!eventsMap.has(item.year)) {
        eventsMap.set(item.year, {
          year: item.year,
          weather: item.weather,
          party: item.party,
          note: item.note,
          story: item.story || null,               
          partyPhoto: item.partyPhoto || null,     
          harvestPhoto: item.harvestPhoto || null, 
          yearlyAlbum: item.yearlyAlbum || null, 
          locations: new Set(),
          harvests: []
        });
      }
      
      const event = eventsMap.get(item.year);
      
      // If a subsequent row for the same year has the story/photos/album, grab them
      if (!event.story && item.story) event.story = item.story;
      if (!event.yearlyAlbum && item.yearlyAlbum) event.yearlyAlbum = item.yearlyAlbum;
      
      // Handle Rowy image arrays or direct strings
      if (!event.partyPhoto && item.partyPhoto) {
        event.partyPhoto = Array.isArray(item.partyPhoto) ? item.partyPhoto[0]?.downloadURL : item.partyPhoto;
      }
      if (!event.harvestPhoto && item.harvestPhoto) {
        event.harvestPhoto = Array.isArray(item.harvestPhoto) ? item.harvestPhoto[0]?.downloadURL : item.harvestPhoto;
      }

      if (item.location && item.location !== 'N/A' && item.location !== 'Varies') {
        event.locations.add(item.location);
      }
      if (item.hunter !== "No Harvest") {
        event.harvests.push(item);
      }
    });
    return Array.from(eventsMap.values()).sort((a,b) => b.year - a.year);
  }, [statsData]);

  const totalHarvests = statsData.filter(d => d.hunter !== "No Harvest").length;
  const skunkedYears = groupedTimelineEvents.filter(e => e.harvests.length === 0).length;

  return (
    <div className="min-h-screen bg-[#f8f7f4] text-stone-900 font-sans">
      {/* Navigation */}
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

      <main className="max-w-7xl mx-auto p-4 md:p-10">
        
        {/* Heritage Stats Bar (Hidden on Gallery and Yearbook Tabs for more space) */}
        {activeTab !== 'gallery' && activeTab !== 'yearbook' && (
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <HeroStat label="Establishment" value="1961" sub="Nov 1st Purchase" color="emerald" />
            <HeroStat label="Harvest Count" value={isDataImported ? totalHarvests : "185+"} sub={isDataImported ? "Confirmed Records" : "Est. Total History"} color="amber" />
            <HeroStat label="Skunked Years" value={isDataImported ? skunkedYears : "6"} sub="Total Recorded" color="stone" />
            <HeroStat label="Tradition Age" value="65" sub="Continuous Years" color="blue" />
          </section>
        )}

        {/* LEDGER TAB */}
        {activeTab === 'archive' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden flex flex-col h-full">
                
                {/* Advanced Filtering Header */}
                <div className="p-6 border-b border-stone-100 bg-stone-50/50">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <div>
                      <h2 className="text-2xl font-serif font-bold text-stone-800 italic">"The Meat Pole"</h2>
                      <p className="text-sm text-stone-500">
                        {isDataImported ? `Displaying ${statsData.length} live Rowy records` : "Curated historical highlights"}
                      </p>
                    </div>
                    <div className="relative w-full md:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                      <input 
                        className="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
                        placeholder="Search notes, hunters, stands..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-stone-200 text-sm shadow-sm">
                      <Filter size={14} className="text-stone-400" />
                      <select 
                        className="bg-transparent outline-none text-stone-600 font-medium"
                        value={filterDecade}
                        onChange={(e) => setFilterDecade(e.target.value)}
                      >
                        <option value="All">All Decades</option>
                        {decades.map(dec => <option key={dec} value={dec}>{dec}s</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-stone-200 text-sm shadow-sm">
                      <Target size={14} className="text-stone-400" />
                      <select 
                        className="bg-transparent outline-none text-stone-600 font-medium"
                        value={filterSex}
                        onChange={(e) => setFilterSex(e.target.value)}
                      >
                        <option value="All">All Types</option>
                        <option value="Buck">Bucks</option>
                        <option value="Doe">Does / Fawns</option>
                      </select>
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
                      {filteredData.length > 0 ? filteredData.map((item, i) => (
                        <tr key={i} className="hover:bg-emerald-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <span className="font-serif font-black text-lg text-emerald-950">{item.year}</span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-stone-800">{item.hunter}</p>
                            <p className="text-[10px] text-stone-400 flex items-center gap-1 mt-0.5">
                              <Users size={10} /> Party: {item.party || 'Unk'}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-sm text-stone-600">
                              <MapPin size={12} className="text-emerald-600/50" /> {item.location}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${item.sex === 'Buck' ? 'bg-amber-100 text-amber-800 border border-amber-200' : item.sex === 'Doe' || item.sex.includes('Doe') ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-stone-100 text-stone-400 border border-stone-200'}`}>
                              {item.sex}
                            </span>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="4" className="text-center py-10 text-stone-400 italic">No records match your filters.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Side Cards */}
            <div className="lg:col-span-4 space-y-6">
              
              {!isDataImported && (
                <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 p-6 rounded-3xl text-white shadow-xl border border-emerald-700">
                  <h3 className="font-bold text-lg mb-2">Sync with Rowy</h3>
                  <p className="text-emerald-100 text-sm leading-relaxed mb-6">
                    Upload your <code className="bg-emerald-900 px-1 rounded">StatsX2025.csv</code> to automatically populate your Rowy workspace and this live website.
                  </p>
                  <div className="relative w-full">
                    <input 
                      type="file" 
                      accept=".csv" 
                      id="csv-upload-ledger" 
                      className="hidden" 
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                    <label htmlFor="csv-upload-ledger" className={`bg-white text-emerald-900 w-full text-center py-3 rounded-xl text-sm font-black hover:bg-emerald-50 transition-colors shadow-md flex items-center justify-center gap-2 ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                      {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />} 
                      {isUploading ? 'Syncing to Rowy...' : 'Upload & Sync CSV File'}
                    </label>
                  </div>
                </div>
              )}

              {isDataImported && (
                <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-200 shadow-sm flex items-start gap-4 relative overflow-hidden">
                  <CloudLightning className="text-emerald-200 absolute -right-4 -bottom-4 w-32 h-32" />
                  <CheckCircle2 className="text-emerald-600 shrink-0 relative z-10" size={24} />
                  <div className="relative z-10">
                    <h3 className="font-bold text-emerald-900">Rowy Database Active</h3>
                    <p className="text-emerald-700 text-xs mt-1 leading-relaxed">
                      Successfully synced <strong>{statsData.length} records</strong>. This website is now live-linked to your Rowy table. Any edits made in Rowy will appear here instantly.
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-[#1e312a] p-8 rounded-3xl text-emerald-50 relative overflow-hidden shadow-xl">
                <div className="relative z-10">
                  <h3 className="text-amber-400 font-bold uppercase tracking-widest text-xs mb-4">Camp Voices</h3>
                  <p className="text-sm italic leading-relaxed font-serif opacity-90">
                    "We came for the deer, but we stayed for each other... It’s only the 6th time we were officially skunked. But a season isn’t measured by the meat pole."
                  </p>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="w-8 h-px bg-emerald-500" />
                    <span className="text-[10px] uppercase tracking-widest font-black text-emerald-400">Chronology, 2025</span>
                  </div>
                </div>
                <div className="absolute -bottom-10 -right-10 text-emerald-800 opacity-20">
                  <Home size={160} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Harvest Timeline Area Chart */}
              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
                <div className="mb-6">
                  <h3 className="font-serif font-bold text-xl text-stone-800">Harvests Over Time</h3>
                  <p className="text-xs text-stone-400 uppercase tracking-widest mt-1">Grouped by 5-Year Intervals</p>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorHarvests" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#047857" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#047857" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                      <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#78716c' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: '#78716c' }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        cursor={{ stroke: '#10b981', strokeWidth: 2, strokeDasharray: '4 4' }}
                      />
                      <Area type="monotone" dataKey="harvests" name="Recorded Harvests" stroke="#047857" strokeWidth={3} fillOpacity={1} fill="url(#colorHarvests)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Harvesters Bar Chart */}
              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-serif font-bold text-xl text-stone-800">Top Harvesters</h3>
                    <p className="text-xs text-stone-400 uppercase tracking-widest mt-1">All-Time Leaderboard</p>
                  </div>
                  <Award className="text-amber-500" size={24} />
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hunterStats} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e7e5e4" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#44403c', fontWeight: 'bold' }} width={80} />
                      <Tooltip cursor={{ fill: '#f5f5f4' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                      <Bar dataKey="count" name="Deer Harvested" radius={[0, 4, 4, 0]}>
                        {hunterStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Buck/Doe Ratio */}
              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col items-center">
                <h3 className="font-serif font-bold text-lg text-stone-800 w-full text-left">Harvest Type Ratio</h3>
                <div className="h-48 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sexStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#047857" /> {/* Buck */}
                        <Cell fill="#d97706" /> {/* Doe */}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex gap-6 mt-2">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#047857]"></div><span className="text-sm font-bold text-stone-600">Bucks</span></div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#d97706]"></div><span className="text-sm font-bold text-stone-600">Does</span></div>
                </div>
              </div>

              {/* Data Import Control Panel */}
              <div className="md:col-span-2 bg-gradient-to-br from-stone-100 to-stone-200 p-8 rounded-3xl border border-stone-300 flex flex-col justify-center relative overflow-hidden">
                <Target size={120} className="absolute -right-6 -bottom-6 text-stone-300 opacity-50" />
                <div className="relative z-10 max-w-md">
                  <h3 className="text-xl font-bold text-stone-800 mb-2">
                    {isDataImported ? "Rowy Sync Active" : "Notice Regarding Data"}
                  </h3>
                  <p className="text-stone-600 text-sm leading-relaxed mb-6">
                    {isDataImported 
                      ? "The charts and tables above are now utilizing the complete dataset synced from your Rowy workspace."
                      : "The charts above are generated from curated highlights. To populate your Rowy table and this website simultaneously, please upload your complete CSV file."}
                  </p>
                  
                  {!isDataImported && (
                    <div className="relative">
                      <input 
                        type="file" 
                        accept=".csv" 
                        id="csv-upload-analytics" 
                        className="hidden" 
                        onChange={handleFileUpload}
                        disabled={isUploading}
                      />
                      <label htmlFor="csv-upload-analytics" className={`bg-stone-800 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-stone-700 transition-colors shadow-md inline-flex items-center gap-2 ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                         {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} 
                         {isUploading ? 'Syncing...' : 'Select & Sync CSV Data'}
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TIMELINE TAB */}
        {activeTab === 'chronology' && (
          <div className="max-w-4xl mx-auto py-10 relative">
             <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-stone-300 md:-translate-x-1/2" />
             
             {groupedTimelineEvents.map((event, i) => {
               const hasYearbookContent = event.story || event.partyPhoto || event.harvestPhoto || event.yearlyAlbum;
               const isExpanded = expandedYears.has(event.year);

               return (
                 <div key={i} className={`relative flex flex-col md:flex-row items-start md:items-center gap-8 mb-20 ${i % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                   
                   <div className="ml-12 md:ml-0 md:w-1/2">
                     <div className={`bg-white rounded-3xl border shadow-sm transition-all duration-300 relative overflow-hidden ${hasYearbookContent ? 'border-emerald-200 shadow-emerald-900/5' : 'border-stone-200'}`}>
                        
                        {/* Summary Header Section */}
                        <div className="p-8 relative">
                          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <History size={80} />
                          </div>
                          
                          <div className="flex items-baseline justify-between mb-4">
                            <div className="flex items-baseline gap-2">
                              <span className="text-4xl font-serif font-black text-emerald-950">{event.year}</span>
                            </div>
                            
                            {/* Yearbook Badge */}
                            {hasYearbookContent && (
                              <span className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1 border border-amber-200">
                                <BookText size={12} /> Chapter Available
                              </span>
                            )}
                          </div>
                          
                          <h4 className="text-xl font-bold text-stone-800 mb-2">
                            {event.harvests.length === 0 ? "The Woods Prevail" : 
                             event.harvests.length === 1 ? `${event.harvests[0].hunter}'s Harvest` :
                             `Multiple Harvests: ${event.harvests.length} Deer`}
                          </h4>

                          {event.harvests.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {event.harvests.map((h, idx) => (
                                <span key={idx} className="text-xs font-bold bg-emerald-50 text-emerald-800 px-2 py-1 border border-emerald-100 rounded-md">
                                  {h.hunter} ({h.sex})
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2 mb-4">
                            {Array.from(event.locations).slice(0, 2).map((loc, idx) => (
                              <Tag key={idx} icon={<MapPin size={10}/>} text={loc} />
                            ))}
                            {event.weather && <Tag icon={<Wind size={10}/>} text={event.weather} />}
                            <Tag icon={<Users size={10}/>} text={`${event.party} Hunters`} />
                          </div>
                          
                          {/* Short CSV Note */}
                          {(!isExpanded || !event.story) && (
                            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100 italic text-stone-600 text-sm leading-relaxed border-l-4 border-l-stone-300 shadow-inner">
                              "{event.note}"
                            </div>
                          )}
                        </div>

                        {/* Expandable Yearbook Section */}
                        {hasYearbookContent && (
                          <div className={`overflow-hidden transition-all duration-500 bg-[#fbfaf9] border-t border-emerald-100 ${isExpanded ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="p-8">
                              
                              {/* Photo Gallery Grid */}
                              {(event.partyPhoto || event.harvestPhoto) && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                  {event.partyPhoto && (
                                    <div className="flex flex-col gap-2">
                                      <img src={event.partyPhoto} alt={`${event.year} Hunting Party`} className="w-full h-48 object-cover rounded-2xl shadow-sm border border-stone-200" />
                                      <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest text-center">The Party</span>
                                    </div>
                                  )}
                                  {event.harvestPhoto && (
                                    <div className="flex flex-col gap-2">
                                      <img src={event.harvestPhoto} alt={`${event.year} Harvest`} className="w-full h-48 object-cover rounded-2xl shadow-sm border border-stone-200" />
                                      <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest text-center">The Harvest</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Long Form Story Text */}
                              {event.story && (
                                <div className="prose prose-stone prose-sm mb-6">
                                  <div className="w-8 h-px bg-emerald-300 mb-4" />
                                  <p className="font-serif text-stone-700 leading-loose text-[15px] text-justify whitespace-pre-line">
                                    {event.story}
                                  </p>
                                </div>
                              )}

                              {/* Yearly Album Button */}
                              {event.yearlyAlbum && (
                                <div className="mt-8 text-center border-t border-stone-200 pt-8">
                                  <a 
                                    href={event.yearlyAlbum} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="inline-flex items-center gap-3 bg-white hover:bg-emerald-50 text-stone-700 hover:text-emerald-800 px-6 py-3 rounded-full font-bold text-xs uppercase tracking-widest transition-all border border-stone-200 hover:border-emerald-200 shadow-sm"
                                  >
                                    <ImageIcon size={14} /> 
                                    Open Complete {event.year} Photo Album 
                                    <ExternalLink size={14} className="opacity-50" />
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Read Chapter Button */}
                        {hasYearbookContent && (
                          <button 
                            onClick={() => toggleYear(event.year)}
                            className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 py-3 border-t border-emerald-100 font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                          >
                            {isExpanded ? (
                              <><ChevronUp size={16} /> Close Chapter</>
                            ) : (
                              <><ChevronDown size={16} /> Read The {event.year} Chapter</>
                            )}
                          </button>
                        )}

                     </div>
                   </div>

                   {/* Center Marker */}
                   <div className="absolute left-6 md:left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
                     <div className={`w-5 h-5 rounded-full border-4 shadow-md ${hasYearbookContent ? 'border-amber-200 bg-amber-500' : event.harvests.length === 0 ? 'border-[#f8f7f4] bg-stone-400' : 'border-[#f8f7f4] bg-emerald-700'}`} />
                   </div>

                   <div className="hidden md:block md:w-1/2" />
                 </div>
               );
             })}
          </div>
        )}

        {/* THE BOOK / YEARBOOK TAB */}
        {activeTab === 'yearbook' && (
          <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto">
            {/* Chapters Sidebar */}
            <div className="w-full md:w-64 shrink-0">
              <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm sticky top-32 max-h-[80vh] overflow-y-auto">
                <h3 className="font-serif font-black text-xl text-emerald-950 mb-6 flex items-center gap-2">
                  <BookMarked size={20} className="text-emerald-700" /> Chapters
                </h3>
                <div className="space-y-1">
                  {groupedTimelineEvents.map((event) => {
                    const isActive = (activeYearbookYear || groupedTimelineEvents[0]?.year) === event.year;
                    return (
                      <button
                        key={event.year}
                        onClick={() => setActiveYearbookYear(event.year)}
                        className={`w-full text-left px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                          isActive 
                            ? 'bg-emerald-800 text-white shadow-md' 
                            : 'text-stone-600 hover:bg-emerald-50 hover:text-emerald-800'
                        }`}
                      >
                        {event.year} Season
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Mobile Chapter Select */}
              <div className="md:hidden mb-6">
                <select 
                  className="w-full bg-white border border-stone-200 p-4 rounded-2xl font-bold text-emerald-900 shadow-sm"
                  value={activeYearbookYear || groupedTimelineEvents[0]?.year || ''}
                  onChange={(e) => setActiveYearbookYear(Number(e.target.value))}
                >
                  {groupedTimelineEvents.map(event => (
                    <option key={event.year} value={event.year}>{event.year} Season</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Book Content Area */}
            <div className="flex-1">
              {groupedTimelineEvents
                .filter(e => e.year === (activeYearbookYear || groupedTimelineEvents[0]?.year))
                .map(event => {
                  // Connect to the Rowy data
                  const yearRecords = statsData.filter(d => d.year === event.year);
                  
                  // Extract the new Rowy fields
                  const narrative = yearRecords.find(r => r.story)?.story || 
                                    yearRecords.find(r => r.note && r.note !== 'Imported from CSV')?.note || 
                                    "The full story of this season has not yet been transcribed into the digital archive.";
                  
                  const rawParty = yearRecords.find(r => r.partyPhoto)?.partyPhoto;
                  const partyPhotoUrl = Array.isArray(rawParty) ? rawParty[0]?.downloadURL : rawParty;
                  
                  const rawHarvest = yearRecords.find(r => r.harvestPhoto)?.harvestPhoto;
                  const harvestPhotoUrl = Array.isArray(rawHarvest) ? rawHarvest[0]?.downloadURL : rawHarvest;
                  
                  const yearlyAlbumUrl = yearRecords.find(r => r.yearlyAlbum)?.yearlyAlbum;

                  return (
                    <div key={event.year} className="bg-white rounded-[2rem] border border-stone-200 shadow-xl overflow-hidden animate-in fade-in duration-500">
                      
                      {/* Chapter Header */}
                      <div className="bg-[#1e312a] p-10 md:p-16 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-900 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3"></div>
                        <div className="relative z-10">
                          <p className="text-emerald-400 font-bold uppercase tracking-[0.3em] text-xs mb-4">Chapter {event.year - 1960}</p>
                          <h2 className="text-5xl md:text-7xl font-serif font-black text-white mb-6">
                            {event.year}
                          </h2>
                          <div className="flex flex-wrap justify-center gap-3">
                            {event.weather && <span className="bg-[#14231d] border border-emerald-800/50 text-emerald-100 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2"><Wind size={12}/> {event.weather}</span>}
                            <span className="bg-[#14231d] border border-emerald-800/50 text-emerald-100 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2"><Users size={12}/> {event.party} Hunters</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-8 md:p-16">
                        {/* Narrative Section */}
                        <div className="mb-16">
                          <p className="font-serif leading-loose text-stone-700 text-lg whitespace-pre-line first-letter:text-7xl first-letter:font-black first-letter:text-emerald-900 first-letter:mr-3 first-letter:float-left">
                            {narrative}
                          </p>
                        </div>

                        {/* Photo Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {/* Party Photo Slot */}
                          <div className="space-y-3">
                            <h4 className="font-bold text-stone-800 uppercase tracking-widest text-xs border-b border-stone-200 pb-2">The Hunting Party</h4>
                            {partyPhotoUrl ? (
                              <img src={partyPhotoUrl} alt={`${event.year} Hunting Party`} className="w-full h-72 object-cover rounded-2xl shadow-md border border-stone-200" />
                            ) : (
                              <div className="w-full h-72 bg-stone-50 rounded-2xl border-2 border-dashed border-stone-300 flex flex-col items-center justify-center text-stone-400">
                                <Users size={32} className="mb-2 opacity-30" />
                                <span className="text-xs font-bold">Party Photo Missing</span>
                                <span className="text-[10px] mt-1">Upload via Rowy</span>
                              </div>
                            )}
                          </div>

                          {/* Harvest Photo Slot */}
                          <div className="space-y-3">
                            <h4 className="font-bold text-stone-800 uppercase tracking-widest text-xs border-b border-stone-200 pb-2">The Harvest</h4>
                            {harvestPhotoUrl ? (
                              <img src={harvestPhotoUrl} alt={`${event.year} Harvest`} className="w-full h-72 object-cover rounded-2xl shadow-md border border-stone-200" />
                            ) : (
                              <div className="w-full h-72 bg-stone-50 rounded-2xl border-2 border-dashed border-stone-300 flex flex-col items-center justify-center text-stone-400">
                                <Camera size={32} className="mb-2 opacity-30" />
                                <span className="text-xs font-bold">Harvest Photo Missing</span>
                                <span className="text-[10px] mt-1">Upload via Rowy</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Yearly Album Deep Dive Button */}
                        {yearlyAlbumUrl && (
                          <div className="mt-12 text-center">
                            <a 
                              href={yearlyAlbumUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="inline-flex items-center gap-3 bg-stone-100 hover:bg-emerald-50 text-stone-700 hover:text-emerald-800 px-8 py-4 rounded-full font-bold text-sm transition-all border border-stone-200 hover:border-emerald-200 shadow-sm hover:shadow-md"
                            >
                              <ImageIcon size={18} /> 
                              View Complete {event.year} Photo Album 
                              <ExternalLink size={16} className="opacity-50" />
                            </a>
                          </div>
                        )}

                        {/* Harvest Ledger Summary */}
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

        {/* PHOTO VAULT / GALLERY TAB */}
        {activeTab === 'gallery' && (
          <div className="max-w-5xl mx-auto py-10 px-4">
            <div className="bg-white rounded-[2.5rem] p-8 md:p-16 border border-stone-200 shadow-xl text-center relative overflow-hidden">
              
              {/* Background decorative elements */}
              <div className="absolute top-0 left-0 w-full h-full bg-stone-50/50 pointer-events-none" />
              <div className="absolute -top-24 -right-24 text-stone-100 pointer-events-none opacity-50 transform rotate-12">
                <ImageIcon size={400} />
              </div>

              <div className="relative z-10 flex flex-col items-center max-w-2xl mx-auto">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-800 rounded-3xl flex items-center justify-center mb-8 shadow-sm border border-emerald-200">
                  <Camera size={40} />
                </div>
                
                <h2 className="text-4xl md:text-5xl font-serif font-black text-stone-800 mb-6 leading-tight">
                  The Sand River <br/><span className="text-emerald-800 italic">Photo Vault</span>
                </h2>
                
                <p className="text-lg text-stone-600 leading-relaxed mb-10">
                  Sixty-five years of tradition cannot be captured in a spreadsheet alone. 
                  We have carefully preserved over <strong className="text-stone-900">1,000 historical photographs</strong>, 
                  spanning from the original 1947 Adams trailer to the great room renovations of today.
                </p>

                <div className="bg-stone-100 p-6 rounded-2xl border border-stone-200 w-full mb-10 text-left">
                  <h4 className="font-bold text-stone-800 mb-3 flex items-center gap-2">
                    <History size={18} className="text-emerald-700" /> What's Inside the Archive?
                  </h4>
                  <ul className="space-y-3 text-sm text-stone-600">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>The original 1961 "South 40" property purchase documents.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>Decades of successful harvests hanging from the legendary "Meat Pole".</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>The evolution of the camp: Hilton 1st Ave, the Draper Trailer, and Hilton III.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>Three generations of hunters sharing coffee, stories, and Daune's stew.</span>
                    </li>
                  </ul>
                </div>

                <a 
                  href="https://photos.google.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-emerald-800 text-white px-8 py-4 rounded-full text-lg font-black hover:bg-emerald-700 hover:shadow-xl hover:-translate-y-1 transition-all flex items-center gap-3 group"
                >
                  <ImageIcon size={24} className="group-hover:scale-110 transition-transform" /> 
                  Open the 65-Year Photo Archive
                  <ExternalLink size={20} className="opacity-70" />
                </a>

                <p className="text-xs text-stone-400 mt-6 font-medium uppercase tracking-widest">
                  Hosted securely on Google Photos
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-stone-200/50 border-t border-stone-300 py-16 px-10 text-center">
        <div className="max-w-xl mx-auto space-y-6">
          <History size={24} className="mx-auto text-stone-400 opacity-50" />
          <p className="font-serif font-black text-stone-400 tracking-widest text-xl uppercase">Sand River Hilton</p>
          <p className="text-xs text-stone-500 uppercase tracking-[0.4em]">1961 — 2026 and Beyond</p>
          <div className="pt-6 text-[10px] text-stone-400 leading-relaxed font-bold uppercase tracking-widest">
            Dedicated to Founding Fathers Daune Kuss & John Godava.<br/>
            Sixty-Five Years of Tradition.
          </div>
        </div>
      </footer>
    </div>
  );
};

const TabButton = ({ active, onClick, label, icon }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${active ? 'bg-emerald-800 text-white shadow-lg' : 'text-emerald-500 hover:text-emerald-100'}`}
  >
    {icon} {label}
  </button>
);

const HeroStat = ({ label, value, sub, color }) => {
  const colors = {
    emerald: "text-emerald-900 border-emerald-100 bg-white",
    amber: "text-amber-900 border-amber-100 bg-white",
    stone: "text-stone-900 border-stone-100 bg-white",
    blue: "text-blue-900 border-blue-100 bg-white"
  };
  return (
    <div className={`p-6 rounded-3xl border-2 shadow-sm ${colors[color]}`}>
      <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">{label}</p>
      <p className="text-3xl font-serif font-black">{value}</p>
      <p className="text-xs text-stone-400 font-bold mt-1 uppercase tracking-tighter">{sub}</p>
    </div>
  );
};

const Tag = ({ icon, text }) => (
  <span className="flex items-center gap-1.5 px-3 py-1 bg-white border border-stone-200 rounded-full text-[10px] font-bold text-stone-500 shadow-sm">
    {icon} {text}
  </span>
);

export default App;
